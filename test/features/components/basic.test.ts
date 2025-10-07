import { describe, it, expect } from 'vitest';
import { compile } from '@/compiler';
import { readFixture } from '../../helpers';

const baseNamespace = 'App\\View\\Components\\';

describe('Basic Components', () => {
    it('compiles a simple self-closing component', () => {
        const { template, expected } = readFixture('self-closing-component');

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles a component with static and dynamic attributes', () => {
        const { template, expected } = readFixture('component-with-attributes');

        expect(compile(template, baseNamespace).replace(/\s+/g, ' ')).toBe(expected.replace(/\s+/g, ' '));
    });

    it('compiles deeply nested namespaced components', () => {
        const { template, expected } = readFixture('nested-namespaced-components');

        expect(compile(template, baseNamespace).replace(/\s+/g, ' ')).toBe(expected.replace(/\s+/g, ' '));
    });
});
