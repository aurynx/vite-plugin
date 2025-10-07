import { describe, it, expect } from 'vitest';
import { compile } from '@/compiler';
import { readFixture } from '../../helpers';

const baseNamespace = 'App\\View\\Components\\';

describe('Named Slots', () => {
    it('compiles a component with a single named slot', () => {
        const { template, expected } = readFixture('single-named-slot');

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles a component with multiple named slots', () => {
        const { template, expected } = readFixture('multiple-named-slots');

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles a component with named slots and default slot', () => {
        const { template, expected } = readFixture('named-and-default-slot');

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles nested components inside named slots', () => {
        const { template, expected } = readFixture('nested-in-named-slot');

        expect(compile(template, baseNamespace)).toBe(expected);
    });
});
