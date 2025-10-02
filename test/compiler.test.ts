import { describe, it, expect } from 'vitest';
import { compile } from '@/compiler';

const baseNamespace = 'App\\View\\Components\\';

describe('Aurynx View Compiler', () => {
    it('compiles escaped and raw echo statements', () => {
        const template = 'Hello, {{ $name }}. Raw: {{{ $raw_html }}}';
        const expected = "Hello, <?= htmlspecialchars($name, ENT_QUOTES, 'UTF-8') ?>. Raw: <?= $raw_html ?>";

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles dot notation in echos', () => {
        const template = 'User: {{ $user.name }}';
        const expected = "User: <?= htmlspecialchars(data_get($user, 'name'), ENT_QUOTES, 'UTF-8') ?>";

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles a simple @each directive', () => {
        const template = '@each ($users as $user) {{ $user.name }} @endEach';
        const expected = "<?php foreach ($users as $user): ?> <?= htmlspecialchars(data_get($user, 'name'), ENT_QUOTES, 'UTF-8') ?> <?php endforeach; ?>";

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles a simple self-closing component', () => {
        const template = '<x-alert />';
        const expected = "<?= component(componentClass: App\\View\\Components\\Alert::class) ?>";

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles a component with static and dynamic attributes', () => {
        const template = '<x-card title="Static Title" :post="$post" required />';
        const expected = "<?= component(componentClass: App\\View\\Components\\Card::class, props: ['title' => 'Static Title', 'post' => $post, 'required' => 'true']) ?>";

        expect(compile(template, baseNamespace).replace(/\s+/g, ' ')).toBe(expected.replace(/\s+/g, ' '));
    });

    it('recursively compiles components inside a slot', () => {
        const template = '<x-layout><x-card /></x-layout>';
        const expected = "<?= component(componentClass: App\\View\\Components\\Layout::class, slot: function() { ?><?= component(componentClass: App\\View\\Components\\Card::class) ?><?php }) ?>";

        expect(compile(template, baseNamespace)).toBe(expected);
    });

    it('compiles deeply nested namespaced components', () => {
        const template = `
            <x-layout>
              <x-card>
                <x-card.header />
                <x-card.body />
                <x-card.footer />
              </x-card>
            </x-layout>
        `;

        // We use .replace(/\s+/g, '') to make the expected string easier to read and less fragile.
        const expected = `
            <?= component(componentClass: App\\View\\Components\\Layout::class, slot: function() { ?>
                <?= component(componentClass: App\\View\\Components\\Card::class, slot: function() { ?>
                    <?= component(componentClass: App\\View\\Components\\Card\\Header::class) ?>
                    <?= component(componentClass: App\\View\\Components\\Card\\Body::class) ?>
                    <?= component(componentClass: App\\View\\Components\\Card\\Footer::class) ?>
                <?php }) ?>
            <?php }) ?>
        `.replace(/\s+/g, ' ');

        expect(compile(template, baseNamespace).replace(/\s+/g, ' ')).toBe(expected);
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
});
