import { describe, it, expect } from 'vitest';
import { compile } from '@/compiler';
import { readFixture } from '../../helpers';

const baseNamespace = 'App\\View\\Components\\';

describe('Echo Directives', () => {
    it('compiles escaped and raw echo statements', () => {
        const { template, expected } = readFixture('echo-statements');

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles dot notation in echos', () => {
        const { template, expected } = readFixture('dot-notation');

        expect(compile(template, baseNamespace)).toBe(expected);
    });
});
