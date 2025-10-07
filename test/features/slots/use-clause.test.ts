import { describe, it, expect } from 'vitest';
import { compile } from '@/compiler';
import { readFixture, normalizeUseClause } from '../../helpers';

const baseNamespace = 'App\\View\\Components\\';

describe('Slots with Use Clause', () => {
    it('automatically adds a `use` clause for variables inside a slot', () => {
        const { template, expected } = readFixture('use-clause-in-slot');

        expect(normalizeUseClause(compile(template, baseNamespace))).toBe(normalizeUseClause(expected));
    });

    it('compiles named slots with variables and adds use clause', () => {
        const { template, expected } = readFixture('named-slots-with-use-clause');

        const result = normalizeUseClause(compile(template, baseNamespace));

        expect(result).toBe(normalizeUseClause(expected));

        expect(result).toContain("'title' => static function() use ($code)");

        expect(result).toContain("slot: static function() use ($message)");
    });

    it('correctly handles variable scope in slots with loops', () => {
        const { template, expected } = readFixture('slot-with-loop-variable-scope');

        expect(normalizeUseClause(compile(template, baseNamespace), { stripWhitespace: true }))
            .toBe(normalizeUseClause(expected, { stripWhitespace: true }));
    });
});
