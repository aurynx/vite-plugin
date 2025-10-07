import { describe, it, expect } from 'vitest';
import { compile } from '@/compiler';

const baseNamespace = 'App\\View\\Components\\';

describe('Compiler Core', () => {
    it('wraps output in PHP function', () => {
        const html = '<div>Hello World</div>';
        const result = compile(html, baseNamespace);

        expect(result).toContain('declare(strict_types=1)');
        expect(result).toContain('return static function (): string');
        expect(result).toContain(html);
    });

    it('accepts custom base namespace', () => {
        const template = '<x-alert />';
        const customNamespace = 'Custom\\Components\\';
        const result = compile(template, customNamespace);

        expect(result).toContain('Custom\\Components\\Alert');
    });
});
