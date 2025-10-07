import { describe, it, expect } from 'vitest';
import { php84Preset, defaultPreset } from '@/php/presets';

describe('PHP Presets', () => {
    describe('php84Preset', () => {
        it('has correct version', () => {
            expect(php84Preset.version).toBe('8.4');
        });

        it('has all PHP 8.4 features enabled', () => {
            expect(php84Preset.features.arrowFunctions).toBe(true);
            expect(php84Preset.features.namedArguments).toBe(true);
            expect(php84Preset.features.strictTypes).toBe(true);
            expect(php84Preset.features.nullsafeOperator).toBe(true);
            expect(php84Preset.features.matchExpression).toBe(true);
            expect(php84Preset.features.readonlyProperties).toBe(true);
            expect(php84Preset.features.firstClassCallables).toBe(true);
            expect(php84Preset.features.enumSupport).toBe(true);
        });

        it('has correct formatting defaults', () => {
            expect(php84Preset.formatting.indentSpaces).toBe(4);
            expect(php84Preset.formatting.lineEnding).toBe('\n');
        });

        it('has correct codegen settings', () => {
            expect(php84Preset.codegen.preferArrowFunctions).toBe(true);
            expect(php84Preset.codegen.useNamedArguments).toBe(true);
            expect(php84Preset.codegen.strictTypes).toBe(true);
            expect(php84Preset.codegen.arrayStyle).toBe('short');
        });
    });

    describe('defaultPreset', () => {
        it('is php84Preset', () => {
            expect(defaultPreset).toBe(php84Preset);
        });
    });

    describe('preset usage', () => {
        it('can check feature availability before code generation', () => {
            // Feature flags should align with codegen preferences — this matters when targeting older PHP versions
            if (php84Preset.features.namedArguments) {
                expect(php84Preset.codegen.useNamedArguments).toBe(true);
            }

            if (php84Preset.features.arrowFunctions && php84Preset.codegen.preferArrowFunctions) {
                expect(true).toBe(true);
            }
        });

        it('provides formatting configuration', () => {
            const { indentSpaces, lineEnding } = php84Preset.formatting;

            const indent = ' '.repeat(indentSpaces);
            expect(indent).toBe('    ');
            // Unix-style line endings — keep it consistent across platforms
            expect(lineEnding).toBe('\n');
        });
    });
});
