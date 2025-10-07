import { describe, it, expect } from 'vitest';
import { compile } from '@/compiler';
import { readFixture } from '../../helpers';

const baseNamespace = 'App\\View\\Components\\';

describe('@each Directive', () => {
    it('compiles a simple @each directive', () => {
        const { template, expected } = readFixture('each-directive');

        expect(compile(template, baseNamespace)).toBe(expected);
    });
});
