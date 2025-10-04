import { describe, it, expect } from 'vitest';
import { compile } from '@/compiler';
import { readFixture, normalizeUseClause } from './helpers';

const baseNamespace = 'App\\View\\Components\\';

describe('Aurynx View Compiler', () => {
    it('compiles escaped and raw echo statements', () => {
        const { template, expected } = readFixture('echo-statements');

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles dot notation in echos', () => {
        const { template, expected } = readFixture('dot-notation');

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles a simple @each directive', () => {
        const { template, expected } = readFixture('each-directive');

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles a simple self-closing component', () => {
        const { template, expected } = readFixture('self-closing-component');

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles a component with static and dynamic attributes', () => {
        const { template, expected } = readFixture('component-with-attributes');

        expect(compile(template, baseNamespace).replace(/\s+/g, ' ')).toBe(expected.replace(/\s+/g, ' '));
    });

    it('recursively compiles components inside a slot', () => {
        const { template, expected } = readFixture('recursive-components');

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles deeply nested namespaced components', () => {
        const { template, expected } = readFixture('nested-namespaced-components');

        expect(compile(template, baseNamespace).replace(/\s+/g, ' ')).toBe(expected.replace(/\s+/g, ' '));
    });

    it('automatically adds a `use` clause for variables inside a slot', () => {
        const { template, expected } = readFixture('use-clause-in-slot');

        expect(normalizeUseClause(compile(template, baseNamespace))).toBe(normalizeUseClause(expected));
    });

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

    it('compiles named slots with variables and adds use clause', () => {
        const { template, expected } = readFixture('named-slots-with-use-clause');

        const result = normalizeUseClause(compile(template, baseNamespace));

        expect(result).toBe(normalizeUseClause(expected));

        expect(result).toContain("'title' => function() use ($code)");

        expect(result).toContain("slot: function() use ($message)");
    });

    it('compiles nested components inside named slots', () => {
        const { template, expected } = readFixture('nested-in-named-slot');

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles layout component with HTML structure and comments', () => {
        const { template, expected } = readFixture('layout-component');

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles layout component with nested content and components', () => {
        const { template, expected } = readFixture('layout-with-content');

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('correctly handles variable scope in slots with loops', () => {
        const { template, expected } = readFixture('slot-with-loop-variable-scope');

        expect(normalizeUseClause(compile(template, baseNamespace), { stripWhitespace: true }))
            .toBe(normalizeUseClause(expected, { stripWhitespace: true }));
    });
});
