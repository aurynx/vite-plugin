import { describe, it, expect } from 'vitest';
import {compileDotNotationInExpression, parseAttributes, tagNameToClassName} from '@/helpers';

describe('Compiler Helpers', () => {
    describe('parseAttributes', () => {
        it('handles an empty string', () => {
            expect(parseAttributes('')).toEqual({});
        });

        it('handles boolean attributes', () => {
            expect(parseAttributes('disabled')).toEqual({ disabled: 'true' });
        });

        it('parses static and dynamic attributes', () => {
            const attrs = 'class="text-red" :title="$post.title" required';

            expect(parseAttributes(attrs)).toEqual({
                class: 'text-red',
                ':title': '$post.title',
                required: 'true',
            });
        });
    });

    describe('tagNameToClassName', () => {
        it('converts simple tags', () => {
            expect(tagNameToClassName('alert', 'App\\')).toBe('App\\Alert');
        });

        it('converts kebab-case tags', () => {
            expect(tagNameToClassName('main-navigation', 'App\\')).toBe('App\\MainNavigation');
        });

        it('converts dot-notation tags to namespaces', () => {
            expect(tagNameToClassName('form.input', 'App\\')).toBe('App\\Form\\Input');
        });
    });

    describe('compileDotNotationInExpression', () => {
        it('compiles simple dot notation', () => {
            const expression = '$user.name';
            const expected = "data_get($user, 'name')";

            expect(compileDotNotationInExpression(expression)).toBe(expected);
        });

        it('compiles deep dot notation', () => {
            const expression = '$user.address.city';
            const expected = "data_get($user, 'address.city')";

            expect(compileDotNotationInExpression(expression)).toBe(expected);
        });

        it('leaves simple variables untouched', () => {
            const expression = '$user';

            expect(compileDotNotationInExpression(expression)).toBe('$user');
        });

        it('compiles dot notation within a larger expression', () => {
            const expression = '$user.id === 1';
            const expected = "data_get($user, 'id') === 1";

            expect(compileDotNotationInExpression(expression)).toBe(expected);
        });
    });
});
