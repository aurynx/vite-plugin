import type { AttributeMap } from '@/types';

/**
 * Parses an attribute string from a component tag into a key-value object.
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
 * Compiles dot notation within a PHP expression.
 */
export const compileDotNotationInExpression = (expression: string): string => {
    return expression.replace(/(\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\.([a-zA-Z0-9_.]+)/g,
        (_match, variable, path) => `data_get(${variable}, '${path}')`
    );
};

/**
 * Converts a kebab-case/dot-notation tag name into a PascalCase PHP class name.
 */
export const tagNameToClassName = (tagName: string, baseNamespace: string): string => {
    const parts = tagName.split('.').map(part =>
        part.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')
    );

    return baseNamespace + parts.join('\\');
};

/**
 * Finds all unique PHP variables used in the original Aurynx template.
 * Scans before compilation to extract variables for explicit assignment generation.
 * @param template The raw Aurynx template string.
 * @returns An array of unique variable names (without $ prefix).
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

    // Pattern 3: @each($items as $item) - extract collection variable only, exclude loop variable
    const eachRegex = /@each\s*\(\s*\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\s+as\s+(?:\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*(?:\s*=>\s*)?)?\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\)/g;
    const loopVars = new Set<string>();
    while ((match = eachRegex.exec(template)) !== null) {
        vars.add(match[1]); // Add collection variable (e.g., $users)
        loopVars.add(match[2]); // Track loop variable to exclude (e.g., $user)
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
 * Generates PHP code for explicit variable assignments from $__data array.
 * @param variables Array of variable names (without $ prefix).
 * @returns PHP code string with variable assignments.
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
 * Finds all unique PHP variables (e.g., $user, $post) used within a string,
 * ignoring variables that are defined within the content itself (like in @each).
 * @param content The string content to scan.
 * @returns An array of unique variable names.
 */
export const findUsedVariables = (content: string): string[] => {
    // 1. Find all variables being defined in loops (e.g., `as $user`, `as $key => $value`)
    // We use a non-greedy match to correctly handle nested loops in the future.
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
