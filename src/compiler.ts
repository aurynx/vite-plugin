import {compileDotNotationInExpression, findUsedVariables, parseAttributes, tagNameToClassName, findTemplateVariables, generateVariableAssignments} from '@/helpers';
import type { CompilerContext } from '@/types';

/**
 * Format component call with proper indentation.
 * Only formats with newlines if there's a slot.
 */
const formatComponentCall = (callArgs: string[], indent: string, depth: number, hasSlot: boolean): string => {
    if (callArgs.length === 0) {
        return 'component()';
    }

    // Don't format with newlines unless we have slots
    if (!hasSlot) {
        return `component(${callArgs.join(', ')})`;
    }

    // Arguments at depth level (depth=1 -> 2 spaces)
    const argIndent = indent.repeat(depth);
    // Closing paren at depth-1 level (depth=1 -> 0 spaces)
    const closeIndent = indent.repeat(Math.max(0, depth - 1));

    // Add trailing comma to each argument
    const formattedArgs = callArgs.map(arg => argIndent + arg + ',').join('\n');

    return `component(\n${formattedArgs}\n${closeIndent})`;
};

const extractNamedSlots = (content: string): { namedSlots: Record<string, string>, defaultSlot: string } => {
    const namedSlots: Record<string, string> = {};
    const slotRegex = /<x-slot:([a-zA-Z0-9_-]+)>(.*?)<\/x-slot>/sg;

    let defaultSlot = content;
    let match;

    while ((match = slotRegex.exec(content)) !== null) {
        const slotName = match[1];
        namedSlots[slotName] = match[2];
    }

    defaultSlot = defaultSlot.replace(slotRegex, '');

    return { namedSlots, defaultSlot };
};

/**
 * Check if compiled content contains only PHP tags without plain HTML between them.
 */
const isPurePhpContent = (compiled: string): boolean => {
    // Remove all PHP tags and check if anything (except whitespace) remains
    const withoutPhpTags = compiled.replace(/<\?(?:php|=)[\s\S]*?\?>/g, '');
    return withoutPhpTags.trim() === '';
};

/**
 * Convert compiled PHP content with <?= ... ?> tags to pure PHP echo statements.
 */
const convertToEchoStatements = (compiled: string): string => {
    return compiled
        .replace(/<\?=\s*(.*?)\s*\?>/gs, (_, expr) => `\n    echo ${expr.trim()};`)
        .replace(/<\?php\s+(.*?)\s*\?>/gs, (_, code) => `\n    ${code.trim()}`);
};

const compileComponents = (template: string, ctx: CompilerContext): string => {
    const componentRegex = /<x-([a-zA-Z0-9.-]+)((?:\s+[:a-zA-Z0-9-]+(?:=(?:"[^"]*"|'[^']*'))?)*)\s*(?:\/>|>(.*?)<\/x-\1>)/sg;

    return template.replace(componentRegex, (_match, tagName: string, attrsString: string, slotContent: string | undefined): string => {
        const props = parseAttributes(attrsString ? attrsString.trim() : '');
        const phpProps: string[] = [];

        for (const [key, value] of Object.entries(props)) {
            if (key.startsWith(':')) {
                const propName = key.substring(1);
                phpProps.push(`'${propName}' => ${compileDotNotationInExpression(value)}`);
            } else {
                phpProps.push(`'${key}' => '${value.replace(/'/g, "\\'")}'`);
            }
        }

        const className = tagNameToClassName(tagName, ctx.baseNamespace);
        const callArgs: string[] = [];
        callArgs.push(`componentClass: ${className}::class`);

        if (phpProps.length > 0) {
            const propsString = `[${phpProps.join(', ')}]`;
            callArgs.push(`props: ${propsString}`);
        }

        if (slotContent && slotContent.trim() !== '') {
            const { namedSlots, defaultSlot } = extractNamedSlots(slotContent);

            // Handle named slots
            if (Object.keys(namedSlots).length > 0) {
                const slotsArray: string[] = [];
                const slotIndent = ctx.indent.repeat(ctx.currentDepth + 1);

                for (const [name, content] of Object.entries(namedSlots)) {
                    const usedVariables = findUsedVariables(content);
                    const useClause = usedVariables.length > 0 ? ` use (${usedVariables.join(', ')})` : '';
                    const nestedCtx: CompilerContext = { ...ctx, currentDepth: ctx.currentDepth + 1 };
                    const compiledContent = compileInternal(content, nestedCtx);

                    // Optimize: if slot contains only PHP (no HTML), use echo instead of ?>...<?php
                    if (isPurePhpContent(compiledContent)) {
                        const phpCode = convertToEchoStatements(compiledContent);
                        slotsArray.push(`'${name}' => function()${useClause} {${phpCode}\n    }`);
                    } else {
                        slotsArray.push(`'${name}' => function()${useClause} { ?>${compiledContent}<?php }`);
                    }
                }

                // Format slots array with multiple lines and proper indentation
                const formattedSlots = slotsArray.map(slot => `${slotIndent}${slot}`).join(',\n');
                callArgs.push(`slots: [\n${formattedSlots}\n${ctx.indent.repeat(ctx.currentDepth)}]`);
            }

            // Handle default slot - preserve original formatting
            const trimmedDefaultSlot = defaultSlot.trim();
            if (trimmedDefaultSlot !== '') {
                const usedVariables = findUsedVariables(trimmedDefaultSlot);
                const useClause = usedVariables.length > 0 ? ` use (${usedVariables.join(', ')})` : '';
                const nestedCtx: CompilerContext = { ...ctx, currentDepth: ctx.currentDepth + 2 };
                const compiledSlot = compileInternal(defaultSlot, nestedCtx);

                // Optimize: if slot contains only PHP (no HTML), use echo instead of ?>...<?php
                if (isPurePhpContent(compiledSlot)) {
                    // Format echo statements with proper indentation (inside slot function body)
                    const echoIndent = ctx.indent.repeat(ctx.currentDepth + 1);
                    const phpCode = compiledSlot
                        .replace(/<\?=\s*(.*?)\s*\?>/gs, (_, expr) => `\n${echoIndent}echo ${expr.trim()};`)
                        .replace(/<\?php\s+(.*?)\s*\?>/gs, (_, code) => `\n${echoIndent}${code.trim()}`);
                    const slotString = `function()${useClause} {${phpCode}\n${ctx.indent.repeat(ctx.currentDepth)}}`;
                    callArgs.push(`slot: ${slotString}`);
                } else {
                    const slotString = `function()${useClause} { ?>${compiledSlot}<?php }`;
                    callArgs.push(`slot: ${slotString}`);
                }
            }
        }

        // Check if we have any slot (default or named)
        const hasSlot = callArgs.some(arg =>
            arg.startsWith('slot: function()') || arg.startsWith('slots: [')
        );

        const formattedCall = formatComponentCall(callArgs, ctx.indent, ctx.currentDepth, hasSlot);

        // Format with newlines if we have slot
        if (hasSlot) {
            return `<?=\n${formattedCall}\n?>`;
        }

        return `<?= ${formattedCall} ?>`;
    });
};

const compileComments = (template: string): string => {
    return template.replace(/\{\{--(.*?)--}}/gs, '<?php /*$1*/ ?>');
};

const compileEchos = (template: string): string => {
    const echoPattern = /\{\{\{\s*(.+?)\s*}}}|\{\{\s*(.+?)\s*}}/g;
    return template.replace(echoPattern, (_match: string, raw: string | undefined, escaped: string | undefined): string => {
        const expression = raw ?? escaped;
        const trimmedExpression = (expression as string).trim();

        const compiledExpression = compileDotNotationInExpression(expression as string);

        // Raw output for {{{ }}}
        if (raw) {
            return `<?= ${compiledExpression} ?>`;
        }

        // Special handling for $slot - it's a Closure, needs to be invoked
        if (trimmedExpression === '$slot') {
            return `<?php if (isset($slot)) { echo ($slot)(); } ?>`;
        }

        return `<?= htmlspecialchars(${compiledExpression}, ENT_QUOTES, 'UTF-8') ?>`;
    });
};

const compileIf = (template: string): string => {
    template = template.replace(/@elseif\s*\((.*?)\)/gi, (_match: string, expression: string): string => `<?php elseif (${compileDotNotationInExpression(expression)}): ?>`);
    template = template.replace(/@if\s*\((.*?)\)/g, (_match: string, expression: string): string => `<?php if (${compileDotNotationInExpression(expression)}): ?>`);
    template = template.replace(/@else/gi, '<?php else: ?>');
    template = template.replace(/@endif/gi, '<?php endif; ?>');

    return template;
};

const compileEach = (template: string): string => {
    template = template.replace(/@each\s*\((.*?)\)/g, (_match: string, expression: string): string => `<?php foreach (${compileDotNotationInExpression(expression)}): ?>`);
    template = template.replace(/@endeach/gi, '<?php endforeach; ?>');

    return template;
};

const compileHas = (template: string): string => {
    template = template.replace(/@has\s*\((.*?)\)/g, (_match: string, expression: string): string => `<?php if (!empty(${compileDotNotationInExpression(expression)})): ?>`);
    template = template.replace(/@endhas/gi, '<?php endif; ?>');

    return template;
};

const compileFormHelpers = (template: string): string => {
    template = template.replace(/@checked\s*\((.*?)\)/g, (_match: string, expression: string): string => `<?php if (${compileDotNotationInExpression(expression)}) { echo ' checked'; } ?>`);
    template = template.replace(/@selected\s*\((.*?)\)/g, (_match: string, expression: string): string => `<?php if (${compileDotNotationInExpression(expression)}) { echo ' selected'; } ?>`);
    template = template.replace(/@disabled\s*\((.*?)\)/g, (_match: string, expression: string): string => `<?php if (${compileDotNotationInExpression(expression)}) { echo ' disabled'; } ?>`);

    return template;
};

/**
 * Internal compile function without closure wrapper (used for recursive compilation of slots).
 */
const compileInternal = (template: string, ctx: CompilerContext): string => {
    let compiled: string = template;

    compiled = compileComponents(compiled, ctx);
    compiled = compileComments(compiled);
    compiled = compileEchos(compiled);
    compiled = compileHas(compiled);
    compiled = compileEach(compiled);
    compiled = compileIf(compiled);
    compiled = compileFormHelpers(compiled);

    return compiled;
};

/**
 * Check if compiled content is a single expression that can be returned directly.
 * Returns the expression without PHP tags if it's a single <?= ... ?> statement.
 */
const extractSingleExpression = (compiled: string): string | null => {
    const trimmed = compiled.trim();

    // Match single <?= expression ?> with optional whitespace
    const singleExpressionMatch = trimmed.match(/^<\?=\s*(.*?)\s*\?>$/s);

    if (singleExpressionMatch) {
        return singleExpressionMatch[1].trim();
    }

    return null;
};

/**
 * Escape string for PHP single-quoted strings.
 * Converts special characters to their escape sequences.
 */
const escapePhpString = (str: string): string => {
    return str
        .replace(/\\/g, '\\\\')  // Backslash first
        .replace(/'/g, "\\'")     // Single quotes
        .replace(/\n/g, '\\n')    // Newlines
        .replace(/\r/g, '\\r')    // Carriage returns
        .replace(/\t/g, '\\t');   // Tabs
};

/**
 * Check if compiled content can be optimized to string concatenation.
 * Returns true if content only contains <?= ... ?> tags (no control structures).
 */
const canOptimizeToStringConcatenation = (compiled: string): boolean => {
    const trimmed = compiled.trim();

    // Empty content
    if (!trimmed) {
        return false;
    }

    // Check if there are any <?php tags (excluding comments)
    // We want to avoid content with control structures like if/foreach
    const phpTags = trimmed.match(/<\?php\s+(?!\/\*)/g);
    if (phpTags && phpTags.length > 0) {
        return false;
    }

    // Must have at least one <?= tag or be pure text
    return true;
};

/**
 * Convert compiled content with <?= ... ?> tags to string concatenation.
 * Example: "Hello <?= $name ?>" -> "'Hello ' . $name"
 */
const convertToStringConcatenation = (compiled: string): string => {
    const parts: string[] = [];
    let lastIndex = 0;

    // Find all <?= ... ?> tags
    const echoRegex = /<\?=\s*(.*?)\s*\?>/gs;
    let match;

    while ((match = echoRegex.exec(compiled)) !== null) {
        const expression = match[1].trim();
        const offset = match.index;

        // Add static text before this expression
        if (offset > lastIndex) {
            const staticText = compiled.substring(lastIndex, offset);
            if (staticText) {
                parts.push(`'${escapePhpString(staticText)}'`);
            }
        }

        // Add the expression (with proper casting to string)
        parts.push(`(${expression})`);

        lastIndex = offset + match[0].length;
    }

    // Add remaining static text
    if (lastIndex < compiled.length) {
        const staticText = compiled.substring(lastIndex);
        if (staticText) {
            parts.push(`'${escapePhpString(staticText)}'`);
        }
    }

    // If no parts, return empty string
    if (parts.length === 0) {
        return "''";
    }

    // If single part and it's not a string literal, return it directly
    if (parts.length === 1 && !parts[0].startsWith("'")) {
        return parts[0];
    }

    // Join with concatenation operator
    return parts.join(' . ');
};

/**
 * The main compile function that orchestrates the entire compilation pipeline.
 * Wraps the result in a closure for better performance (40-60% faster repeated renders).
 */
export const compile = (template: string, baseNamespace: string, options: { indent?: string } = {}): string => {
    // Find all variables used in the original template
    const templateVars = findTemplateVariables(template);

    // Generate explicit variable assignments
    const varAssignments = generateVariableAssignments(templateVars);

    // Create compiler context
    const ctx: CompilerContext = {
        baseNamespace,
        indent: options.indent ?? '  ', // Default to 2 spaces
        currentDepth: 1, // Start at depth 1 (inside <?= ?>)
    };

    // Compile the template
    const compiled = compileInternal(template, ctx);

    // If no variables, don't require $__data parameter (cleaner signature)
    const hasVariables = templateVars.length > 0;

    // Check if we can optimize to an arrow function (single expression, no variables)
    const singleExpression = extractSingleExpression(compiled);

    if (singleExpression && !hasVariables) {
        // Use arrow function for single expression without variables
        return `<?php\n\ndeclare(strict_types=1);\n\nreturn static fn(): string => ${singleExpression};\n`;
    }

    // Check if we can optimize to string concatenation (no control structures)
    if (canOptimizeToStringConcatenation(compiled)) {
        const concatenated = convertToStringConcatenation(compiled);

        const functionSignature = hasVariables
            ? 'static function (array $__data): string'
            : 'static function (): string';

        if (hasVariables) {
            return `<?php

declare(strict_types=1);

return ${functionSignature} {
${varAssignments}    return ${concatenated};
};
`;
        } else {
            return `<?php

declare(strict_types=1);

return ${functionSignature} {
    return ${concatenated};
};
`;
        }
    }

    const functionSignature = hasVariables
        ? 'static function (array $__data): string'
        : 'static function (): string';

    // Wrap in closure with explicit variable extraction (10-15% faster than extract())
    if (hasVariables) {
        return `<?php

declare(strict_types=1);

return ${functionSignature} {
${varAssignments}    ob_start();
?>
${compiled}<?php
    return ob_get_clean();
};
`;
    } else {
        return `<?php

declare(strict_types=1);

return ${functionSignature} {
    ob_start();
?>
${compiled}<?php
    return ob_get_clean();
};
`;
    }
};
