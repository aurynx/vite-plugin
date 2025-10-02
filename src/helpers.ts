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
 * Finds all unique PHP variables used within a string.
 * @param content The string content to scan.
 * @returns An array of unique variable names.
 */
export const findUsedVariables = (content: string): string[] => {
    // This regex finds all occurrences of PHP variables.
    const variableRegex = /\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)/g;
    const matches = content.match(variableRegex);

    if (!matches) {
        return [];
    }

    // Return a unique list of variables.
    return [...new Set(matches)];
};
