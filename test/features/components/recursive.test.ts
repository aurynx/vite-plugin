import { describe, it, expect } from 'vitest';
import { compile } from '@/compiler';
import { readFixture } from '../../helpers';

const baseNamespace = 'App\\View\\Components\\';

describe('Recursive Components', () => {
    it('recursively compiles components inside a slot', () => {
        const { template, expected } = readFixture('recursive-components');

        expect(compile(template, baseNamespace)).toBe(expected);
    });
});
