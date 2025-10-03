import { describe, it, expect } from 'vitest';
import { compile } from '@/compiler';
import { readTemplate, readExpected } from './helpers/fixtures';

const baseNamespace = 'App\\View\\Components\\';

describe('Aurynx View Compiler', () => {
    it('compiles escaped and raw echo statements', () => {
        const fixtureName = 'echo-statements';
        const template = readTemplate(fixtureName);
        const expected = readExpected(fixtureName);

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles dot notation in echos', () => {
        const fixtureName = 'dot-notation';
        const template = readTemplate(fixtureName);
        const expected = readExpected(fixtureName);

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles a simple @each directive', () => {
        const fixtureName = 'each-directive';
        const template = readTemplate(fixtureName);
        const expected = readExpected(fixtureName);

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles a simple self-closing component', () => {
        const fixtureName = 'self-closing-component';
        const template = readTemplate(fixtureName);
        const expected = readExpected(fixtureName);

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles a component with static and dynamic attributes', () => {
        const fixtureName = 'component-with-attributes';
        const template = readTemplate(fixtureName);
        const expected = readExpected(fixtureName);

        expect(compile(template, baseNamespace).replace(/\s+/g, ' ')).toBe(expected.replace(/\s+/g, ' '));
    });

    it('recursively compiles components inside a slot', () => {
        const fixtureName = 'recursive-components';
        const template = readTemplate(fixtureName);
        const expected = readExpected(fixtureName);

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles deeply nested namespaced components', () => {
        const fixtureName = 'nested-namespaced-components';
        const template = readTemplate(fixtureName);
        const expected = readExpected(fixtureName);

        expect(compile(template, baseNamespace).replace(/\s+/g, ' ')).toBe(expected.replace(/\s+/g, ' '));
    });

    it('automatically adds a `use` clause for variables inside a slot', () => {
        const template = '<x-card>{{ $post.title }} by {{ $author->name }}</x-card>';

        // The expected output now correctly reflects that `->name` is preserved as native PHP.
        const expected = "<?= component(componentClass: App\\View\\Components\\Card::class, slot: function() use ($author, $post) { ?><?= htmlspecialchars(data_get($post, 'title'), ENT_QUOTES, 'UTF-8') ?> by <?= htmlspecialchars($author->name, ENT_QUOTES, 'UTF-8') ?><?php }) ?>";

        // We normalize the `use` clause for a reliable test.
        const normalizeUseClause = (str: string) => {
            return str.replace(/use \((.*?)\)/, (_match, p1) => {
                const vars = p1.split(', ').sort().join(', ');

                return `use (${vars})`;
            });
        };

        expect(normalizeUseClause(compile(template, baseNamespace))).toBe(normalizeUseClause(expected));
    });

    it('compiles a component with a single named slot', () => {
        const fixtureName = 'single-named-slot';
        const template = readTemplate(fixtureName);
        const expected = readExpected(fixtureName);

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles a component with multiple named slots', () => {
        const fixtureName = 'multiple-named-slots';
        const template = readTemplate(fixtureName);
        const expected = readExpected(fixtureName);

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles a component with named slots and default slot', () => {
        const fixtureName = 'named-and-default-slot';
        const template = readTemplate(fixtureName);
        const expected = readExpected(fixtureName);

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles named slots with variables and adds use clause', () => {
        const template = '<x-alert><x-slot:title>Error: {{ $code }}</x-slot>Message: {{ $message }}</x-alert>';

        const normalizeUseClause = (str: string) => {
            return str.replace(/use \((.*?)\)/g, (_match, p1) => {
                const vars = p1.split(', ').sort().join(', ');
                return `use (${vars})`;
            });
        };

        const result = normalizeUseClause(compile(template, baseNamespace));

        // Named slot should have $code in use clause
        expect(result).toContain("'title' => function() use ($code)");

        // Default slot should have $message in use clause
        expect(result).toContain("slot: function() use ($message)");
    });

    it('compiles nested components inside named slots', () => {
        const fixtureName = 'nested-in-named-slot';
        const template = readTemplate(fixtureName);
        const expected = readExpected(fixtureName);

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles layout component with HTML structure and comments', () => {
        const fixtureName = 'layout-component';
        const template = readTemplate(fixtureName);
        const expected = readExpected(fixtureName);

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles layout component with nested content and components', () => {
        const fixtureName = 'layout-with-content';
        const template = readTemplate(fixtureName);
        const expected = readExpected(fixtureName);

        expect(compile(template, baseNamespace)).toBe(expected);
    });
});
