import { describe, it, expect } from 'vitest';
import { phpSyntax } from '@/php/syntax';

describe('PHP Syntax Library', () => {
    describe('tags', () => {
        it('provides correct PHP tags', () => {
            expect(phpSyntax.tags.open).toBe('<?php');
            expect(phpSyntax.tags.close).toBe('?>');
            expect(phpSyntax.tags.shortEcho).toBe('<?=');
        });
    });

    describe('declare', () => {
        it('provides strict types declaration', () => {
            expect(phpSyntax.declare.strictTypes).toBe('declare(strict_types=1);');
        });
    });

    describe('functions.arrow', () => {
        it('generates regular arrow function', () => {
            const result = phpSyntax.functions.arrow.regular('$x', 'int', '$x * 2');
            expect(result).toBe('fn($x): int => $x * 2');
        });

        it('generates arrow function without return type', () => {
            const result = phpSyntax.functions.arrow.regular('$x', '', '$x * 2');
            expect(result).toBe('fn($x) => $x * 2');
        });

        it('generates static arrow function', () => {
            const result = phpSyntax.functions.arrow.static('', 'string', 'component()');
            expect(result).toBe('static fn(): string => component()');
        });
    });

    describe('functions.regular', () => {
        it('generates anonymous function', () => {
            const result = phpSyntax.functions.regular.anonymous('', '', '{ return "test"; }');
            expect(result).toBe('function() { return "test"; }');
        });

        it('generates anonymous function with return type', () => {
            const result = phpSyntax.functions.regular.anonymous('$x', 'int', '{ return $x; }');
            expect(result).toBe('function($x): int { return $x; }');
        });
    });

    describe('return', () => {
        it('generates simple return statement', () => {
            const result = phpSyntax.return.simple('$value');
            expect(result).toBe('return $value;');
        });

        it('generates return with arrow function', () => {
            const result = phpSyntax.return.arrowFunction('', 'string', 'component()');
            expect(result).toBe('return static fn(): string => component();');
        });
    });

    describe('namedArgs', () => {
        it('formats named argument', () => {
            const result = phpSyntax.namedArgs.format('title', '"Hello"');
            expect(result).toBe('title: "Hello"');
        });

        it('formats named argument with class constant', () => {
            const result = phpSyntax.namedArgs.format('componentClass', 'Alert::class');
            expect(result).toBe('componentClass: Alert::class');
        });
    });

    describe('operators', () => {
        it('provides class constant operator', () => {
            expect(phpSyntax.operators.classConstant).toBe('::class');
        });

        it('provides nullsafe operator', () => {
            expect(phpSyntax.operators.nullsafe).toBe('?->');
        });
    });

    describe('arrays', () => {
        it('generates short array syntax', () => {
            const result = phpSyntax.arrays.short(['"a"', '"b"', '"c"']);
            expect(result).toBe('["a", "b", "c"]');
        });

        it('generates associative array', () => {
            const result = phpSyntax.arrays.associative([
                ["'name'", "'John'"],
                ["'age'", '30']
            ]);
            expect(result).toBe("['name' => 'John', 'age' => 30]");
        });
    });

    describe('types', () => {
        it('provides all PHP 8.4 types', () => {
            expect(phpSyntax.types.string).toBe('string');
            expect(phpSyntax.types.int).toBe('int');
            expect(phpSyntax.types.mixed).toBe('mixed');
            expect(phpSyntax.types.never).toBe('never');
            expect(phpSyntax.types.true).toBe('true');
            expect(phpSyntax.types.false).toBe('false');
        });
    });
});
