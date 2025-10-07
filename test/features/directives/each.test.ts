import { describe, it, expect } from 'vitest';
import { compile } from '@/compiler';
import { readFixture } from '../../helpers';

const baseNamespace = 'App\\View\\Components\\';

describe('@each Directive', () => {
    it('compiles a simple @each directive', () => {
        const { template, expected } = readFixture('each-directive');

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('excludes loop variables from template variable extraction', () => {
        const { template, expected } = readFixture('each-with-loop-variable');

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('optimizes repeated data_get() calls inside foreach loops', () => {
        const { template, expected } = readFixture('loop-with-repeated-data-get');

        expect(compile(template, baseNamespace)).toBe(expected);
    });
});
