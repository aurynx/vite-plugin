import { describe, it, expect } from 'vitest';
import { compile } from '@/compiler';
import { readFixture } from '../../helpers';

const baseNamespace = 'App\\View\\Components\\';

describe('Echo Directives', () => {
    it('compiles escaped and raw echo statements', () => {
        const { template, expected } = readFixture('echo-statements');

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles dot notation in echos', () => {
        const { template, expected } = readFixture('dot-notation');

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('does not wrap expressions in unnecessary parentheses', () => {
        const template = 'Hello, {{ $name }}!';
        const result = compile(template, baseNamespace);

        // Should not have (htmlspecialchars(...))
        expect(result).not.toMatch(/\(htmlspecialchars\([^)]+\)\)/);
        // Should have htmlspecialchars without extra parens
        expect(result).toContain('htmlspecialchars($name, ENT_QUOTES, \'UTF-8\')');
    });

    it('generates clean concatenation without parentheses', () => {
        const template = '{{ $var1 }} and {{ $var2 }}';
        const result = compile(template, baseNamespace);

        // Should generate: htmlspecialchars($var1, ...) . ' and ' . htmlspecialchars($var2, ...)
        // Not: (htmlspecialchars($var1, ...)) . ' and ' . (htmlspecialchars($var2, ...))
        expect(result).toContain('htmlspecialchars($var1');
        expect(result).toContain('htmlspecialchars($var2');
        expect(result).not.toMatch(/\(htmlspecialchars\(\$var1[^)]*\)\)/);
        expect(result).not.toMatch(/\(htmlspecialchars\(\$var2[^)]*\)\)/);
    });

    it('handles raw output without extra parentheses', () => {
        const template = 'Text: {{{ $html }}}';
        const result = compile(template, baseNamespace);

        // Raw output should not be wrapped in parentheses
        expect(result).not.toMatch(/\(\$html\)/);
        expect(result).toContain('$html');
    });
});
