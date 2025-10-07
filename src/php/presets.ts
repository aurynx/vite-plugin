import { PhpBuilderConfig } from './builder';

/**
 * Defines a target PHP version with available features and codegen preferences.
 * Presets let the code generator pick safe or modern constructs depending on
 * the intended runtime environment.
 */
export interface PhpPreset {
    /**
     * PHP version string (e.g., "8.4").
     */
    version: string;

    /**
     * Language features available at this version. These flags are used by the
     * builder to decide which constructs are permitted when generating code.
     */
    features: {
        arrowFunctions: boolean;
        namedArguments: boolean;
        strictTypes: boolean;
        nullsafeOperator: boolean;
        matchExpression: boolean;
        readonlyProperties: boolean;
        firstClassCallables: boolean;
        enumSupport: boolean;
    };

    /**
     * Formatting options controlling indentation and line endings for generated code.
     */
    formatting: PhpBuilderConfig;

    /**
     * Code generation preferences — opt into or out of using modern language features
     * even when they are available.
     */
    codegen: {
        /**
         * Prefer arrow functions where they make the output clearer and shorter.
         */
        preferArrowFunctions: boolean;

        /**
         * Use named arguments for readability when generating function calls.
         */
        useNamedArguments: boolean;

        /**
         * Emit declare(strict_types=1) at the top of generated files when true.
         */
        strictTypes: boolean;

        /**
         * Choose array literal style: short [] or long array(). Short is preferred.
         */
        arrayStyle: 'short' | 'long';
    };
}

/**
 * PHP 8.4 preset — the baseline supported version for generated output.
 * Enables modern conveniences while still being broadly compatible.
 */
export const php84Preset: PhpPreset = {
    version: '8.4',

    features: {
        arrowFunctions: true,           // PHP 7.4+
        namedArguments: true,           // PHP 8.0+
        strictTypes: true,              // PHP 7.0+
        nullsafeOperator: true,         // PHP 8.0+
        matchExpression: true,          // PHP 8.0+
        readonlyProperties: true,       // PHP 8.1+
        firstClassCallables: true,      // PHP 8.1+
        enumSupport: true,              // PHP 8.1+
    },

    formatting: {
        indentSpaces: 4,
        lineEnding: '\n',
    },

    codegen: {
        preferArrowFunctions: true,
        useNamedArguments: true,
        strictTypes: true,
        arrayStyle: 'short',
    },
};

/**
 * Default preset currently maps to the PHP 8.4 preset.
 */
export const defaultPreset = php84Preset;
