import type { AttributeMap } from '@/types';

/**
 * Parses an attribute string from a component tag into a key-value object.
 *
 * Notes:
 * - Supports shorthand boolean attributes (no value -> 'true').
 * - Keeps binding names (e.g. ':prop') intact so callers can distinguish
 *   between static and dynamic values.
 */
export const parseAttributes = (attrsString: string): AttributeMap => {
    const attrs: AttributeMap = {};

    if (!attrsString) {
        return attrs;
    }

    const attrRegex = /([:a-zA-Z0-9-]+)(?:=(?:"([^"]*)"|'([^']*)'))?/g;

    let match;

    while ((match = attrRegex.exec(attrsString)) !== null) {
        attrs[match[1]] = match[2] ?? match[3] ?? 'true';
    }

    return attrs;
};

/**
 * Rewrite dot-notation access within PHP expressions into data_get calls.
 * Example: $user.name -> data_get($user, 'name')
 *
 * Rationale: data_get preserves safe access semantics for arrays/objects in
 * compiled templates without introducing runtime errors for missing keys.
 */
export const compileDotNotationInExpression = (expression: string): string => {
    return expression.replace(/(\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\.([a-zA-Z0-9_.]+)/g,
        (_match, variable, path) => `data_get(${variable}, '${path}')`
    );
};

/**
 * Convert a kebab-case and dot-notated component tag into a fully-qualified
 * PascalCase PHP class name under the provided base namespace.
 *
 * Example: "ui.button.primary" with base "App\\View\\Components\\"
 * becomes "App\\View\\Components\\Ui\\Button\\Primary".
 */
export const tagNameToClassName = (tagName: string, baseNamespace: string): string => {
    const parts = tagName.split('.').map(part =>
        part.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')
    );

    return baseNamespace + parts.join('\\');
};

/**
 * Find all unique template-level PHP variables referenced in the raw Aurynx
 * template. The output excludes internal names and loop-assigned variables.
 *
 * This is used to generate explicit variable assignments for the compiled
 * closure signature so templates don't rely on implicit extract() behaviour.
 */
export const findTemplateVariables = (template: string): string[] => {
    const vars = new Set<string>();

    // Pattern 1: {{ $variable }} and {{{ $variable }}}
    const echoRegex = /\{\{\{?\s*\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)/g;
    let match;
    while ((match = echoRegex.exec(template)) !== null) {
        vars.add(match[1]);
    }

    // Pattern 2: @if($variable), @elseif($variable)
    const conditionalRegex = /@(?:if|elseif)\s*\(\s*\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)/g;
    while ((match = conditionalRegex.exec(template)) !== null) {
        vars.add(match[1]);
    }

    // Pattern 3: @each($items as $item) or @each($key => $value) - extract collection variable only, exclude loop variables
    // Support dot-notation in collection: @each($cart.items as $item)
    const eachRegex = /@each\s*\(\s*\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)(?:\.[a-zA-Z0-9_.]+)?\s+as\s+(?:\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\s*=>\s*)?\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\)/g;
    const loopVars = new Set<string>();
    while ((match = eachRegex.exec(template)) !== null) {
        vars.add(match[1]); // Add collection variable (e.g., $users or $cart from $cart.items)
        if (match[2]) {
            loopVars.add(match[2]); // Track key variable to exclude (e.g., $key)
        }
        loopVars.add(match[3]); // Track loop variable to exclude (e.g., $user or $item)
    }

    // Pattern 4: Component props :prop="$variable" or :prop="'string $variable'"
    const propRegex = /:\s*[a-zA-Z0-9_-]+\s*=\s*["'][^"']*\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)/g;
    while ((match = propRegex.exec(template)) !== null) {
        vars.add(match[1]);
    }

    // Pattern 5: Inside PHP expressions within {{ }} - like $user->name, $items[0]
    const dotNotationRegex = /\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)(?:->|\[|\.)/g;
    while ((match = dotNotationRegex.exec(template)) !== null) {
        vars.add(match[1]);
    }

    // Pattern 6: Plain PHP code <?= $variable ?> or <?php $variable ?>
    const phpCodeRegex = /<\?(?:=|php)\s+[^?]*?\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)/g;
    while ((match = phpCodeRegex.exec(template)) !== null) {
        vars.add(match[1]);
    }

    // Exclude special internal variables and loop variables
    const excludeVars = ['slot', '__data', '__path'];
    const filtered = Array.from(vars).filter(v => !excludeVars.includes(v) && !loopVars.has(v));

    return filtered.sort(); // Sort for consistent output
};

/**
 * Generate PHP code that assigns entries from the $__data array to local
 * variables used in the template. This avoids implicit extraction and makes
 * the generated code easier to read and reason about.
 */
export const generateVariableAssignments = (variables: string[]): string => {
    if (variables.length === 0) {
        return '    // No variables used\n\n';
    }

    return variables
        .map(varName => `    $${varName} = $__data['${varName}'] ?? null;`)
        .join('\n') + '\n\n';
};

/**
 * Extract unique PHP variables used in a content fragment, excluding those
 * defined by the fragment itself (e.g. loop variables). Returns variable
 * names including the leading '$'.
 *
 * Note: this function is conservative and uses regexes; it may not catch
 * every edge case in complex embedded PHP code.
 */
export const findUsedVariables = (content: string): string[] => {
    // 1. Find all variables being defined in loops (e.g., `as $user`, `as $key => $value`)
    // Use a non-greedy match to reduce false positives in nested contexts.
    const definedVarRegex = /@each\s*\(.*?as\s+(?:(\$[a-zA-Z0-9_]+)\s*=>\s*)?(\$[a-zA-Z0-9_]+)\)/g;
    const definedVars = new Set<string>();
    let match;

    while ((match = definedVarRegex.exec(content)) !== null) {
        // The key, e.g., $key
        if (match[1]) {
            definedVars.add(match[1])
        }

        // The value, e.g., $user
        if (match[2]) {
            definedVars.add(match[2])
        }
    }

    // 2. Find all variable usages
    const usedVarRegex = /\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)/g;
    const allUsed = content.match(usedVarRegex) ?? [];
    const uniqueUsed = [...new Set(allUsed)];

    // 3. Filter out the variables that were defined inside the content.
    return uniqueUsed.filter(variable => !definedVars.has(variable));
};
