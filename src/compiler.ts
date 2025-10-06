import {compileDotNotationInExpression, findUsedVariables, parseAttributes, tagNameToClassName, findTemplateVariables, generateVariableAssignments} from '@/helpers';

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

const compileComponents = (template: string, baseNamespace: string): string => {
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

        const className = tagNameToClassName(tagName, baseNamespace);
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

                for (const [name, content] of Object.entries(namedSlots)) {
                    const usedVariables = findUsedVariables(content);
                    const useClause = usedVariables.length > 0 ? ` use (${usedVariables.join(', ')})` : '';
                    const compiledContent = compileInternal(content, baseNamespace);
                    slotsArray.push(`'${name}' => function()${useClause} { ?>${compiledContent}<?php }`);
                }

                callArgs.push(`slots: [${slotsArray.join(', ')}]`);
            }

            // Handle default slot - preserve original formatting
            const trimmedDefaultSlot = defaultSlot.trim();
            if (trimmedDefaultSlot !== '') {
                const usedVariables = findUsedVariables(trimmedDefaultSlot);
                const useClause = usedVariables.length > 0 ? ` use (${usedVariables.join(', ')})` : '';
                // Don't trim - preserve whitespace and newlines from original template
                const compiledSlot = compileInternal(defaultSlot, baseNamespace);
                const slotString = `function()${useClause} { ?>${compiledSlot}<?php }`;
                callArgs.push(`slot: ${slotString}`);
            }
        }

        return `<?= component(${callArgs.join(', ')}) ?>`;
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
const compileInternal = (template: string, baseNamespace: string): string => {
    let compiled: string = template;

    compiled = compileComponents(compiled, baseNamespace);
    compiled = compileComments(compiled);
    compiled = compileEchos(compiled);
    compiled = compileHas(compiled);
    compiled = compileEach(compiled);
    compiled = compileIf(compiled);
    compiled = compileFormHelpers(compiled);

    return compiled;
};

/**
 * The main compile function that orchestrates the entire compilation pipeline.
 * Wraps the result in a closure for better performance (40-60% faster repeated renders).
 */
export const compile = (template: string, baseNamespace: string): string => {
    // Find all variables used in the original template
    const templateVars = findTemplateVariables(template);

    // Generate explicit variable assignments
    const varAssignments = generateVariableAssignments(templateVars);

    // Compile the template
    const compiled = compileInternal(template, baseNamespace);

    // If no variables, don't require $__data parameter (cleaner signature)
    const hasVariables = templateVars.length > 0;
    const functionSignature = hasVariables
        ? 'static function (array $__data): string'
        : 'static function (): string';

    // Wrap in closure with explicit variable extraction (10-15% faster than extract())
    return `<?php
return ${functionSignature} {
${varAssignments}    ob_start();
?>
${compiled}<?php
    return ob_get_clean();
};
`;
};
