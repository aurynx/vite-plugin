import {compileDotNotationInExpression, findUsedVariables, parseAttributes, tagNameToClassName, findTemplateVariables, generateVariableAssignments} from '@/helpers';
import type { CompilerContext } from '@/types';
import { createPhpBuilder } from '@/php';

/**
 * Format a component() call with sensible indentation.
 * Only introduces line breaks when a slot is present to keep simple calls compact.
 *
 * Note: indentation depth is controlled by the compiler context; changing that
 * scheme would require updating callers that rely on the current alignment.
 */
const formatComponentCall = (callArgs: string[], indent: string, depth: number, hasSlot: boolean): string => {
    if (callArgs.length === 0) {
        return 'component()';
    }

    // Keep single-line calls compact unless a slot requires multi-line formatting.
    if (!hasSlot) {
        return `component(${callArgs.join(', ')})`;
    }

    // Indentation for arguments at the requested depth.
    const argIndent = indent.repeat(depth);
    // Closing paren aligns one level up from the last argument.
    const closeIndent = indent.repeat(Math.max(0, depth - 1));

    // Add trailing comma to each argument for clearer diffs and alignment.
    const formattedArgs = callArgs.map(arg => argIndent + arg + ',').join('\n');

    return `component(\n${formattedArgs}\n${closeIndent})`;
};

/**
 * Extract named slots from a component's slot content.
 * Returns an object with named slot HTML and the remaining default slot.
 *
 * Caveat: this uses a simple regex and may not handle arbitrarily nested
 * <x-slot:...> elements; a DOM/AST-based approach would be more robust.
 */
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
 * Determine whether compiled output contains only PHP tags (no intervening HTML).
 * This allows using pure PHP echo statements inside closures to avoid switching
 * in and out of PHP mode.
 */
const isPurePhpContent = (compiled: string): boolean => {
    // Strip PHP tags and check if anything but whitespace remains.
    const withoutPhpTags = compiled.replace(/<\?(?:php|=)[\s\S]*?\?>/g, '');
    return withoutPhpTags.trim() === '';
};

/**
 * Check if compiled content is a single simple echo expression that can be
 * converted to an arrow function. Returns the expression if true, null otherwise.
 */
const extractSingleEchoExpression = (compiled: string): string | null => {
    const trimmed = compiled.trim();

    // Count how many <?= or <?php tags are present
    const phpTagCount = (trimmed.match(/<\?(?:=|php)/g) || []).length;

    // Only proceed if there's exactly one PHP tag
    if (phpTagCount !== 1) {
        return null;
    }

    // Match single <?= expression ?> with optional whitespace
    const singleEchoMatch = trimmed.match(/^<\?=\s*(.*?)\s*\?>$/s);
    if (singleEchoMatch) {
        return singleEchoMatch[1].trim();
    }
    return null;
};

/**
 * Determine whether slot content is pure static HTML that can be returned
 * directly from an arrow function without any PHP processing.
 * Returns the cleaned HTML if it's pure static content, null otherwise.
 */
const isPureStaticHtml = (content: string): string | null => {
    const trimmed = content.trim();

    // Check for any template syntax that requires compilation:
    // - PHP tags: <?
    // - Variables: $
    // - Directives: @
    // - Template expressions: {{ or {{{
    // - Component tags: <x-
    if (
        trimmed.includes('<?') ||
        trimmed.includes('$') ||
        trimmed.includes('@') ||
        trimmed.includes('{{') ||
        trimmed.includes('<x-')
    ) {
        return null;
    }

    // No template syntax found - it's pure HTML
    return trimmed;
};

/**
 * Convert short echo / PHP blocks into plain echo statements suitable for
 * embedding inside a function body. Preserves basic indentation.
 */
const convertToEchoStatements = (compiled: string): string => {
    return compiled
        .replace(/<\?=\s*(.*?)\s*\?>/gs, (_, expr) => `\n    echo ${expr.trim()};`)
        .replace(/<\?php\s+(.*?)\s*\?>/gs, (_, code) => `\n    ${code.trim()}`);
};

/**
 * Extract all foreach loops from compiled code with their loop variables and content.
 */
const extractForeachLoops = (compiled: string): Array<{
    fullMatch: string;
    loopVar: string;
    content: string;
    startIndex: number;
    endIndex: number;
}> => {
    const loops: Array<{ fullMatch: string; loopVar: string; content: string; startIndex: number; endIndex: number }> = [];
    const foreachRegex = /<\?php\s+foreach\s*\([^)]+as\s+(\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\s*\)\s*:\s*\?>(.*?)<\?php\s+endforeach;\s*\?>/gs;

    let match;
    while ((match = foreachRegex.exec(compiled)) !== null) {
        loops.push({
            fullMatch: match[0],
            loopVar: match[1],
            content: match[2],
            startIndex: match.index,
            endIndex: match.index + match[0].length
        });
    }

    return loops;
};

/**
 * Find all data_get() calls in a code section and return them with their frequency.
 */
const findDataGetCalls = (code: string): Map<string, { variable: string; path: string; count: number }> => {
    const dataGetRegex = /data_get\(\s*(\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\s*,\s*'([^']+)'\s*\)/g;
    const calls = new Map<string, { variable: string; path: string; count: number }>();

    let match;
    while ((match = dataGetRegex.exec(code)) !== null) {
        const fullCall = match[0];
        const variable = match[1];
        const path = match[2];

        if (calls.has(fullCall)) {
            calls.get(fullCall)!.count++;
        } else {
            calls.set(fullCall, { variable, path, count: 1 });
        }
    }

    return calls;
};

/**
 * Generate optimized variable names for data_get calls.
 * Example: data_get($user, 'name') -> $__user_name
 */
const generateDataGetVarName = (variable: string, path: string): string => {
    const varName = variable.replace('$', '');
    const pathParts = path.replace(/\./g, '_');
    return `$__${varName}_${pathParts}`;
};


/**
 * Apply data_get optimizations to compiled code, respecting foreach loop boundaries.
 * Variables used within foreach loops are optimized inside the loop, not at the top level.
 */
const applyDataGetOptimizations = (compiled: string): string => {
    const loops = extractForeachLoops(compiled);

    if (loops.length === 0) {
        // No loops - optimize globally at top level (will be handled by caller)
        return compiled;
    }

    let optimized = compiled;
    let offset = 0;

    // Process loops from end to start to maintain correct indices
    for (let i = loops.length - 1; i >= 0; i--) {
        const loop = loops[i];
        const loopVar = loop.loopVar;

        // Find data_get() calls that use the loop variable
        const loopCalls = findDataGetCalls(loop.content);
        const loopVarCalls = new Map<string, { variable: string; path: string; count: number }>();

        for (const [fullCall, info] of loopCalls.entries()) {
            if (info.variable === loopVar && info.count > 1) {
                loopVarCalls.set(fullCall, info);
            }
        }

        if (loopVarCalls.size > 0) {
            // Optimize data_get calls for loop variable inside the loop
            const foreachStartTag = loop.fullMatch.match(/<\?php\s+foreach\s*\([^)]+\)\s*:\s*\?>/)?.[0] || '';
            const foreachEndTag = '<?php endforeach; ?>';

            let loopContent = loop.content;
            const assignments: string[] = [];

            for (const [fullCall, info] of loopVarCalls.entries()) {
                const optimizedVar = generateDataGetVarName(info.variable, info.path);
                assignments.push(`    ${optimizedVar} = ${fullCall};`);

                // Replace in loop content
                const escapedCall = fullCall.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                loopContent = loopContent.replace(new RegExp(escapedCall, 'g'), optimizedVar);
            }

            // Reconstruct loop with optimizations
            const optimizedLoop = foreachStartTag + '\n' + assignments.join('\n') + loopContent + foreachEndTag;

            // Replace in compiled output
            optimized = optimized.substring(0, loop.startIndex + offset) +
                       optimizedLoop +
                       optimized.substring(loop.endIndex + offset);

            offset += optimizedLoop.length - loop.fullMatch.length;
        }
    }

    return optimized;
};

/**
 * Transform <x-...> component tags into component() call syntax.
 * Handles props (static and dynamic), named/default slots, and several
 * small optimizations (echo-only slots, string concatenation, etc.).
 *
 * Important: parsing is regex-based for simplicity; extremely complex or
 * malformed templates may not be handled correctly. For robust parsing a
 * dedicated template parser/AST would be safer.
 */
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

            // Named slots: compile each slot's content into a Closure
            if (Object.keys(namedSlots).length > 0) {
                const slotsArray: string[] = [];
                const slotIndent = ctx.indent.repeat(ctx.currentDepth + 1);

                for (const [name, content] of Object.entries(namedSlots)) {
                    const trimmedContent = content.trim();
                    const staticHtml = isPureStaticHtml(trimmedContent);

                    if (staticHtml) {
                        // Pure static HTML - return as string, not as function
                        const escapedHtml = staticHtml.replace(/'/g, "\\'").replace(/\n/g, "\\n");
                        slotsArray.push(`'${name}' => '${escapedHtml}'`);
                    } else {
                        const usedVariables = findUsedVariables(content);
                        const nestedCtx: CompilerContext = { ...ctx, currentDepth: ctx.currentDepth + 1 };
                        const compiledContent = compileInternal(content, nestedCtx);

                        // Check if it's a single echo expression - use arrow function
                        const singleEcho = extractSingleEchoExpression(compiledContent);
                        if (singleEcho && usedVariables.length === 0) {
                            const builder = createPhpBuilder();
                            const slotString = builder.staticArrowFunction('', 'string', singleEcho);
                            slotsArray.push(`'${name}' => ${slotString}`);
                        } else if (isPurePhpContent(compiledContent)) {
                            // Optimization: if the slot is only PHP, convert to echo statements
                            // and avoid toggling in/out of PHP tags inside the closure.
                            const phpCode = convertToEchoStatements(compiledContent);
                            // If there are used variables, we need a regular function with use clause
                            if (usedVariables.length > 0) {
                                const useClause = ` use (${usedVariables.join(', ')})`;
                                slotsArray.push(`'${name}' => static function()${useClause}: string {${phpCode}\n    }`);
                            } else {
                                const builder = createPhpBuilder();
                                const slotString = builder.staticFunction('', 'string', `{${phpCode}\n    }`);
                                slotsArray.push(`'${name}' => ${slotString}`);
                            }
                        } else {
                            // Mixed content: keep compiled HTML/PHP wrapped in a closure.
                            if (usedVariables.length > 0) {
                                const useClause = ` use (${usedVariables.join(', ')})`;
                                slotsArray.push(`'${name}' => static function()${useClause}: string { ?>${compiledContent}<?php }`);
                            } else {
                                const builder = createPhpBuilder();
                                const slotString = builder.staticFunction('', 'string', `{ ?>${compiledContent}<?php }`);
                                slotsArray.push(`'${name}' => ${slotString}`);
                            }
                        }
                    }
                }

                // Format slots array with explicit indentation for readability.
                const formattedSlots = slotsArray.map(slot => `${slotIndent}${slot}`).join(',\n');
                callArgs.push(`slots: [\n${formattedSlots}\n${ctx.indent.repeat(ctx.currentDepth)}]`);
            }

            // Default slot: compile and preserve formatting when necessary
            const trimmedDefaultSlot = defaultSlot.trim();
            if (trimmedDefaultSlot !== '') {
                // Check if slot is pure static HTML (no variables, no directives)
                const staticHtml = isPureStaticHtml(trimmedDefaultSlot);

                if (staticHtml) {
                    // Pure static HTML - return as string, not as function
                    const escapedHtml = staticHtml.replace(/'/g, "\\'").replace(/\n/g, "\\n");
                    callArgs.push(`slot: '${escapedHtml}'`);
                } else {
                    const usedVariables = findUsedVariables(trimmedDefaultSlot);
                    const nestedCtx: CompilerContext = { ...ctx, currentDepth: ctx.currentDepth + 2 };
                    const compiledSlot = compileInternal(defaultSlot, nestedCtx);

                    // Check if it's a single echo expression - use arrow function
                    const singleEcho = extractSingleEchoExpression(compiledSlot);
                    if (singleEcho && usedVariables.length === 0) {
                        const builder = createPhpBuilder();
                        const slotString = builder.staticArrowFunction('', 'string', singleEcho);
                        callArgs.push(`slot: ${slotString}`);
                    } else if (isPurePhpContent(compiledSlot)) {
                        // If slot is PHP-only, emit echo statements for cleaner closure bodies.
                        const echoIndent = ctx.indent.repeat(ctx.currentDepth + 1);
                        const phpCode = compiledSlot
                            .replace(/<\?=\s*(.*?)\s*\?>/gs, (_, expr) => `\n${echoIndent}echo ${expr.trim()};`)
                            .replace(/<\?php\s+(.*?)\s*\?>/gs, (_, code) => `\n${echoIndent}${code.trim()}`);

                        if (usedVariables.length > 0) {
                            const useClause = ` use (${usedVariables.join(', ')})`;
                            const slotString = `static function()${useClause}: string {${phpCode}\n${ctx.indent.repeat(ctx.currentDepth)}}`;
                            callArgs.push(`slot: ${slotString}`);
                        } else {
                            const builder = createPhpBuilder();
                            const slotString = builder.staticFunction('', 'string', `{${phpCode}\n${ctx.indent.repeat(ctx.currentDepth)}}`);
                            callArgs.push(`slot: ${slotString}`);
                        }
                    } else {
                        // Mixed content: keep compiled HTML/PHP wrapped in a closure.
                        if (usedVariables.length > 0) {
                            const useClause = ` use (${usedVariables.join(', ')})`;
                            const slotString = `static function()${useClause}: string { ?>${compiledSlot}<?php }`;
                            callArgs.push(`slot: ${slotString}`);
                        } else {
                            const builder = createPhpBuilder();
                            const slotString = builder.staticFunction('', 'string', `{ ?>${compiledSlot}<?php }`);
                            callArgs.push(`slot: ${slotString}`);
                        }
                    }
                }
            }
        }

        // Detect presence of slot-related args to decide formatting style
        const hasSlot = callArgs.some(arg =>
            arg.startsWith('slot: static fn') ||
            arg.startsWith('slot: static function') ||
            arg.startsWith('slot: function()') ||
            arg.startsWith('slots: [')
        );

        const formattedCall = formatComponentCall(callArgs, ctx.indent, ctx.currentDepth, hasSlot);

        // When slots are present use multi-line component invocation for clarity
        if (hasSlot) {
            return `<?=\n${formattedCall}\n?>`;
        }

        return `<?= ${formattedCall} ?>`;
    });
};

/**
 * Convert Aurynx comment syntax {{-- --}} into a PHP block comment.
 */
const compileComments = (template: string): string => {
    return template.replace(/\{\{--(.*?)--}}/gs, '<?php /*$1*/ ?>');
};

/**
 * Compile echo expressions. Handles raw output ({{{ }}}), escaped output ({{ }}),
 * and a special case for $slot which is a Closure that must be invoked.
 *
 * Escaped output uses htmlspecialchars to guard against XSS when rendering HTML.
 */
const compileEchos = (template: string): string => {
    const echoPattern = /\{\{\{\s*(.+?)\s*}}}|\{\{\s*(.+?)\s*}}/g;
    return template.replace(echoPattern, (_match: string, raw: string | undefined, escaped: string | undefined): string => {
        const expression = raw ?? escaped;
        const trimmedExpression = (expression as string).trim();

        const compiledExpression = compileDotNotationInExpression(expression as string);

        // Raw output for {{{ }}} — emit directly without escaping.
        if (raw) {
            return `<?= ${compiledExpression} ?>`;
        }

        // $slot is a Closure; invoke it safely if present.
        if (trimmedExpression === '$slot') {
            return `<?php if (isset($slot)) { echo ($slot)(); } ?>`;
        }

        // Escaped output: apply htmlspecialchars with standard flags.
        return `<?= htmlspecialchars(${compiledExpression}, ENT_QUOTES, 'UTF-8') ?>`;
    });
};

/**
 * Compile conditional directives (@if, @elseif, @else, @endif) to PHP.
 * Expressions are passed through dot-notation compilation to support $obj.prop.
 */
const compileIf = (template: string): string => {
    template = template.replace(/@elseif\s*\((.*?)\)/gi, (_match: string, expression: string): string => `<?php elseif (${compileDotNotationInExpression(expression)}): ?>`);
    template = template.replace(/@if\s*\((.*?)\)/g, (_match: string, expression: string): string => `<?php if (${compileDotNotationInExpression(expression)}): ?>`);
    template = template.replace(/@else/gi, '<?php else: ?>');
    template = template.replace(/@endif/gi, '<?php endif; ?>');

    return template;
};

/**
 * Compile loop directives (@each ... @endeach) into PHP foreach blocks.
 */
const compileEach = (template: string): string => {
    template = template.replace(/@each\s*\((.*?)\)/g, (_match: string, expression: string): string => `<?php foreach (${compileDotNotationInExpression(expression)}): ?>`);
    template = template.replace(/@endeach/gi, '<?php endforeach; ?>');

    return template;
};

/**
 * Compile @has/@endhas directives into PHP empty checks. This maps to a
 * non-empty check to mirror typical template semantics.
 */
const compileHas = (template: string): string => {
    template = template.replace(/@has\s*\((.*?)\)/g, (_match: string, expression: string): string => `<?php if (!empty(${compileDotNotationInExpression(expression)})): ?>`);
    template = template.replace(/@endhas/gi, '<?php endif; ?>');

    return template;
};

/**
 * Helpers for form-related directives that echo attribute strings when true.
 * Converts @checked/@selected/@disabled(...) into small conditional echoes.
 */
const compileFormHelpers = (template: string): string => {
    template = template.replace(/@checked\s*\((.*?)\)/g, (_match: string, expression: string): string => `<?php if (${compileDotNotationInExpression(expression)}) { echo ' checked'; } ?>`);
    template = template.replace(/@selected\s*\((.*?)\)/g, (_match: string, expression: string): string => `<?php if (${compileDotNotationInExpression(expression)}) { echo ' selected'; } ?>`);
    template = template.replace(/@disabled\s*\((.*?)\)/g, (_match: string, expression: string): string => `<?php if (${compileDotNotationInExpression(expression)}) { echo ' disabled'; } ?>`);

    return template;
};

/**
 * Internal compile pipeline used for nested slot compilation. This variant
 * returns compiled content without wrapping it in the final closure.
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
 * Detect a single-expression compiled result of the form `<?= expr ?>` so the
 * compiler can emit a direct return value instead of a buffered template.
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
 * Escape text for inclusion in PHP single-quoted strings. Order matters: backslashes
 * must be escaped first to avoid double-escaping.
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
 * Identify simple foreach loops that consist of static text and <?= ... ?>
 * echoes only. Such loops can be optimized into array_map + implode.
 */
const detectSimpleForeach = (compiled: string): { array: string; itemVar: string; content: string; prefix: string; suffix: string } | null => {
    const trimmed = compiled.trim();

    // Match: <?php foreach ($array as $item): ?> ... <?php endforeach; ?>
    const foreachPattern = /^<\?php\s+foreach\s*\(\s*(\$\w+(?:\s+\?\?\s+\[\])?)\s+as\s+(\$\w+)\s*\)\s*:\s*\?>(.*?)<\?php\s+endforeach;\s*\?>$/s;
    const match = trimmed.match(foreachPattern);

    if (!match) {
        return null;
    }

    const [, arrayExpr, itemVar, content] = match;

    // Avoid nested control structures — optimization targets straightforward loops only.
    const hasNestedControlStructures = /<\?php\s+(if|foreach|while|for)\s/.test(content);
    if (hasNestedControlStructures) {
        return null;
    }

    // Extract prefix/suffix around the echo tags for accurate reconstruction.
    const echoPattern = /<\?=\s*(.*?)\s*\?>/gs;
    const echoMatches = [...content.matchAll(echoPattern)];

    if (echoMatches.length === 0) {
        return null; // No echo statements to optimize
    }

    const firstEchoIndex = content.indexOf(echoMatches[0][0]);
    const lastEchoMatch = echoMatches[echoMatches.length - 1];
    const lastEchoIndex = content.lastIndexOf(lastEchoMatch[0]);

    const prefix = content.substring(0, firstEchoIndex);
    const suffix = content.substring(lastEchoIndex + lastEchoMatch[0].length);

    return {
        array: arrayExpr.trim(),
        itemVar: itemVar.trim(),
        content,
        prefix,
        suffix
    };
};

/**
 * Convert a simple foreach loop into an implode(array_map(...)) expression.
 * This produces a single expression that avoids buffering for predictable
 * loops and can be faster in many PHP runtimes.
 */
const convertForeachToArrayMap = (loopInfo: { array: string; itemVar: string; content: string; prefix: string; suffix: string }): string => {
    const { array, itemVar, content, prefix, suffix } = loopInfo;

    // Split into static parts and expressions, preserving literal text.
    const parts: string[] = [];
    let lastIndex = 0;

    const echoRegex = /<\?=\s*(.*?)\s*\?>/gs;
    let match;

    while ((match = echoRegex.exec(content)) !== null) {
        const expression = match[1].trim();
        const offset = match.index;

        // Add static text preceding the expression.
        if (offset > lastIndex) {
            const staticText = content.substring(lastIndex, offset);
            if (staticText) {
                parts.push(`'${escapePhpString(staticText)}'`);
            }
        }

        // Add the expression itself.
        parts.push(`(${expression})`);

        lastIndex = offset + match[0].length;
    }

    // Append any trailing static text.
    if (lastIndex < content.length) {
        const staticText = content.substring(lastIndex);
        if (staticText) {
            parts.push(`'${escapePhpString(staticText)}'`);
        }
    }

    // Build mapper body and join parts with concatenation.
    const mapperBody = parts.length === 1 && !parts[0].startsWith("'")
        ? parts[0]
        : parts.join(' . ');

    const prefixStr = prefix ? `'${escapePhpString(prefix)}' . ` : '';
    const suffixStr = suffix ? ` . '${escapePhpString(suffix)}'` : '';

    // Use a ternary to gracefully handle null/empty arrays.
    return `(${array} ? ${prefixStr}implode('', array_map(static fn(mixed ${itemVar}): string => ${mapperBody}, ${array}))${suffixStr} : '')`;
};

/**
 * Decide whether compiled content is safe to convert into a single string
 * concatenation expression (no control structures present).
 */
const canOptimizeToStringConcatenation = (compiled: string): boolean => {
    const trimmed = compiled.trim();

    if (!trimmed) {
        return false;
    }

    // Reject content containing PHP control structures — avoid changing semantics.
    const phpTags = trimmed.match(/<\?php\s+(?!\/\*)/g);
    if (phpTags && phpTags.length > 0) {
        return false;
    }

    return true;
};

/**
 * Convert compiled output with <?= ... ?> echo tags into a PHP string
 * concatenation expression, e.g. "Hello <?= $name ?>" => "'Hello ' . $name".
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
 * Build the final PHP wrapper using PhpBuilder for consistent formatting.
 * Generates either an arrow function or a regular function with ob_start/ob_get_clean.
 */
const buildPhpWrapper = (
    compiled: string,
    varAssignments: string,
    hasVariables: boolean,
    singleExpression: string | null = null,
    optimizedReturn: string | null = null,
    skipEmptyLineAfterVars: boolean = false
): string => {
    const builder = createPhpBuilder();

    builder
        .openTag()
        .emptyLine()
        .strictTypes()
        .emptyLine();

    // Case 1: Single expression with arrow function (no variables)
    if (singleExpression && !hasVariables) {
        builder.returnArrowFunction('', 'string', singleExpression);
        builder.emptyLine();
        return builder.build();
    }

    // Case 2: Single expression or optimized return with variables
    if ((singleExpression || optimizedReturn) && hasVariables) {
        const returnValue = singleExpression || optimizedReturn;
        builder.line('return static function (array $__data): string {');
        if (varAssignments.trim()) {
            builder.line(varAssignments.trimEnd());
            if (!skipEmptyLineAfterVars) {
                builder.emptyLine();
            }
        }
        builder.line(`    return ${returnValue};`);
        builder.line('};');
        builder.emptyLine();
        return builder.build();
    }

    // Case 3: Optimized return without variables
    if (optimizedReturn && !hasVariables) {
        builder.line('return static function (): string {');
        builder.line(`    return ${optimizedReturn};`);
        builder.line('};');
        builder.emptyLine();
        return builder.build();
    }

    // Case 4: Full buffered output
    const functionSignature = hasVariables
        ? 'static function (array $__data): string'
        : 'static function (): string';

    builder.line(`return ${functionSignature} {`);

    if (hasVariables && varAssignments.trim()) {
        builder.line(varAssignments.trimEnd());
        builder.emptyLine();
    }

    builder.line('    ob_start();');
    builder.line('?>');
    builder.line(compiled + '<?php');
    builder.line('    return ob_get_clean();');
    builder.line('};');
    builder.emptyLine();

    return builder.build();
};

/**
 * The main compile function that orchestrates the whole pipeline.
 * It extracts template variables, applies a sequence of transforms, and
 * emits an optimized PHP closure. Several optimizations are attempted in
 * order: single-expression return, loop-to-implode, and string concatenation.
 *
 * Performance notes:
 * - The final result is wrapped in a static closure to improve repeated
 *   render performance.
 * - Variable extraction is implemented explicitly rather than using extract()
 *   to keep the generated code clear and slightly faster.
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
    let compiled = compileInternal(template, ctx);

    // Optimize repeated data_get() calls, respecting foreach loop boundaries
    compiled = applyDataGetOptimizations(compiled);

    // Find remaining data_get() calls at top level (outside loops) and optimize them
    const topLevelCode = compiled.replace(/<\?php\s+foreach\s*\([^)]+\)\s*:\s*\?>.*?<\?php\s+endforeach;\s*\?>/gs, '');
    const topLevelCalls = findDataGetCalls(topLevelCode);
    const topLevelAssignments: string[] = [];

    for (const [fullCall, info] of topLevelCalls.entries()) {
        if (info.count > 1) {
            const optimizedVar = generateDataGetVarName(info.variable, info.path);
            topLevelAssignments.push(`    ${optimizedVar} = ${fullCall};`);

            // Replace in compiled output (only outside loops)
            const escapedCall = fullCall.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            compiled = compiled.replace(new RegExp(escapedCall, 'g'), optimizedVar);
        }
    }

    const topLevelOptimizations = topLevelAssignments.length > 0 ? topLevelAssignments.join('\n') + '\n' : '';

    // Combine variable assignments with data_get optimizations
    const allAssignments = varAssignments + topLevelOptimizations;

    // If no variables, don't require $__data parameter (cleaner signature)
    const hasVariables = templateVars.length > 0 || topLevelAssignments.length > 0;

    // Check if we can optimize to a single expression (with or without variables)
    const singleExpression = extractSingleExpression(compiled);

    if (singleExpression) {
        return buildPhpWrapper(compiled, allAssignments, hasVariables, singleExpression);
    }

    // Check if we can optimize simple foreach loops to array_map + implode
    const foreachLoop = detectSimpleForeach(compiled);
    if (foreachLoop) {
        const optimized = convertForeachToArrayMap(foreachLoop);
        return buildPhpWrapper(compiled, allAssignments, hasVariables, null, optimized, true);
    }

    // Check if we can optimize to string concatenation (no control structures)
    if (canOptimizeToStringConcatenation(compiled)) {
        const concatenated = convertToStringConcatenation(compiled);
        return buildPhpWrapper(compiled, allAssignments, hasVariables, null, concatenated);
    }

    // Default case: full buffered output
    return buildPhpWrapper(compiled, allAssignments, hasVariables);
};
