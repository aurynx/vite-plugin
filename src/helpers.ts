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
