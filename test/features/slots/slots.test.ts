import { describe, it, expect } from 'vitest';
import { compile } from '@/compiler';
import { readFixture } from '../../helpers';

const baseNamespace = 'App\\View\\Components\\';

describe('Component Slots', () => {
    it('compiles slot with pure HTML as static arrow function', () => {
        const { template, expected } = readFixture('slot-pure-html');

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles slot with nested component as static function', () => {
        const { template, expected } = readFixture('slot-with-nested-component');

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles slot with complex HTML structure as static arrow function', () => {
        const { template, expected } = readFixture('slot-complex-html');

        expect(compile(template, baseNamespace)).toBe(expected);
    });
});
