import { describe, it, expect } from 'vitest';
import { compile } from '@/compiler';
import { readFixture } from '../../helpers';

const baseNamespace = 'App\\View\\Components\\';

describe('Layout Components', () => {
    it('compiles layout component with HTML structure and comments', () => {
        const { template, expected } = readFixture('layout-component');

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles layout component with nested content and components', () => {
        const { template, expected } = readFixture('layout-with-content');

        expect(compile(template, baseNamespace)).toBe(expected);
    });
});
