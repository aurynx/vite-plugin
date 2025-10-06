/**
 * A key-value map representing HTML attributes.
 * e.g., { class: 'text-red-500', ':disabled': '$isDisabled' }
 */
export type AttributeMap = Record<string, string>;

/**
 * Compiler configuration options.
 */
export interface CompilerOptions {
    /**
     * Indentation string to use for formatting.
     * Examples: '  ' (2 spaces), '    ' (4 spaces), '\t' (tab)
     * @default '  ' (2 spaces)
     */
    indent?: string;
}

/**
 * Internal compiler context passed through compilation stages.
 */
export interface CompilerContext {
    baseNamespace: string;
    indent: string;
    currentDepth: number;
}
