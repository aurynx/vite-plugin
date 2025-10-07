/**
 * PHP syntax primitives used by the code generator.
 *
 * This module centralizes string templates for PHP constructs so the builder
 * and presets can generate consistent, version-aware source code.
 */

export const phpSyntax = {
    /**
     * Opening and closing tags.
     */
    tags: {
        open: '<?php',
        close: '?>',
        shortEcho: '<?=',
    },

    /**
     * File-level declarations such as strict types.
     */
    declare: {
        strictTypes: 'declare(strict_types=1);',
    },

    /**
     * Function syntax builders for arrow and traditional functions.
     * These helpers produce correctly formed function signatures and bodies.
     */
    functions: {
        /**
         * Arrow functions (short closures) — PHP 7.4+. Example: fn($x) => $x * 2
         */
        arrow: {
            regular: (params: string, returnType: string, body: string) =>
                `fn(${params})${returnType ? `: ${returnType}` : ''} => ${body}`,

            static: (params: string, returnType: string, body: string) =>
                `static fn(${params})${returnType ? `: ${returnType}` : ''} => ${body}`,
        },

        /**
         * Traditional function syntax builders for named/anonymous/static forms.
         */
        regular: {
            regular: (name: string, params: string, returnType: string, body: string) =>
                `function ${name}(${params})${returnType ? `: ${returnType}` : ''} ${body}`,

            anonymous: (params: string, returnType: string, body: string) =>
                `function(${params})${returnType ? `: ${returnType}` : ''} ${body}`,

            static: (name: string, params: string, returnType: string, body: string) =>
                `static function ${name}(${params})${returnType ? `: ${returnType}` : ''} ${body}`,
        },
    },

    /**
     * Return statement helpers for simple and arrow-function returns.
     */
    return: {
        simple: (value: string) => `return ${value};`,

        arrowFunction: (params: string, returnType: string, body: string) =>
            `return static fn(${params})${returnType ? `: ${returnType}` : ''} => ${body};`,
    },

    /**
     * Named arguments formatter (PHP 8.0+).
     */
    namedArgs: {
        format: (name: string, value: string) => `${name}: ${value}`,
    },

    /**
     * Type annotations supported by the generator.
     */
    types: {
        string: 'string',
        int: 'int',
        float: 'float',
        bool: 'bool',
        array: 'array',
        object: 'object',
        mixed: 'mixed',
        void: 'void',
        never: 'never',
        null: 'null',
        true: 'true',
        false: 'false',
    },

    /**
     * Common operators used when composing PHP expressions.
     */
    operators: {
        classConstant: '::class',
        objectOperator: '->',
        nullsafe: '?->',
        staticOperator: '::',
    },

    /**
     * Array helpers used to emit literal array syntax.
     */
    arrays: {
        short: (items: string[]) => `[${items.join(', ')}]`,
        associative: (pairs: Array<[string, string]>) =>
            `[${pairs.map(([k, v]) => `${k} => ${v}`).join(', ')}]`,
    },

    /**
     * Comment formatting helpers for single-line, multi-line and doc comments.
     */
    comments: {
        single: (text: string) => `// ${text}`,
        multi: (text: string) => `/* ${text} */`,
        doc: (text: string) => `/** ${text} */`,
    },

    /**
     * Formatting utilities: indentation and newline helpers.
     */
    formatting: {
        indent: (level: number, spaces: number = 4) => ' '.repeat(level * spaces),
        newline: '\n',
        emptyLine: '\n\n',
    },
} as const;
