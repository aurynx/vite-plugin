/**
 * Parsed component attributes mapping. Keys are attribute names (including
 * binding prefixes like ':'), values are their string literal or expression.
 * Example: { class: 'text-red-500', ':disabled': '$isDisabled' }
 */
export type AttributeMap = Record<string, string>;

/**
 * Public-facing compiler options. Currently this focuses on formatting
 * preferences such as the indentation string.
 */
export interface CompilerOptions {
    /**
     * String used for one level of indentation. Default favors compact output.
     * @default '  '
     */
    indent?: string;
}

/**
 * Internal compiler context passed through the pipeline. Tracks the base
 * namespace used for component resolution, the indent string, and the
 * current nesting depth for formatted output.
 */
export interface CompilerContext {
    baseNamespace: string;
    indent: string;
    currentDepth: number;
}
