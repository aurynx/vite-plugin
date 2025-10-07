import { describe, it, expect } from 'vitest';
import { PhpBuilder, createPhpBuilder } from '@/php/builder';

describe('PHP Builder', () => {
    it('creates empty builder', () => {
        const builder = new PhpBuilder();
        expect(builder.build()).toBe('');
    });

    it('builds simple PHP file structure', () => {
        const builder = new PhpBuilder();
        const result = builder
            .openTag()
            .emptyLine()
            .strictTypes()
            .build();

        expect(result).toBe('<?php\n\ndeclare(strict_types=1);');
        expect(result.split('\n')).toHaveLength(3);
    });

    it('builds return arrow function', () => {
        const builder = new PhpBuilder();
        const result = builder
            .openTag()
            .emptyLine()
            .strictTypes()
            .emptyLine()
            .returnArrowFunction('', 'string', 'component()')
            .build();

        expect(result).toContain('<?php');
        expect(result).toContain('declare(strict_types=1);');
        expect(result).toContain('return static fn(): string => component();');
    });

    it('builds component call without props or slots', () => {
        const builder = new PhpBuilder();
        const componentCall = builder.componentCall('App\\View\\Components\\Alert');

        expect(componentCall).toContain('component(');
        expect(componentCall).toContain('componentClass: App\\View\\Components\\Alert::class');
    });

    it('builds component call with props', () => {
        const builder = new PhpBuilder();
        const componentCall = builder.componentCall(
            'App\\View\\Components\\Alert',
            "['type' => 'success']"
        );

        expect(componentCall).toContain('componentClass: App\\View\\Components\\Alert::class');
        expect(componentCall).toContain("props: ['type' => 'success']");
    });

    it('builds component call with slot', () => {
        const builder = new PhpBuilder();
        const componentCall = builder.componentCall(
            'App\\View\\Components\\Alert',
            undefined,
            'function() { ?> Hello <?php }'
        );

        expect(componentCall).toContain('componentClass: App\\View\\Components\\Alert::class');
        expect(componentCall).toContain('slot: function() { ?> Hello <?php }');
    });

    it('builds component call with props and slot', () => {
        const builder = new PhpBuilder();
        const componentCall = builder.componentCall(
            'App\\View\\Components\\Alert',
            "['type' => 'success']",
            'function() { ?> Hello <?php }'
        );

        expect(componentCall).toContain('componentClass:');
        expect(componentCall).toContain('props:');
        expect(componentCall).toContain('slot:');
    });

    it('creates anonymous function', () => {
        const builder = new PhpBuilder();
        const fn = builder.anonymousFunction('', '', '{ ?>Hello<?php }');

        expect(fn).toBe('function() { ?>Hello<?php }');
    });

    it('creates short echo', () => {
        const builder = new PhpBuilder();
        const echo = builder.shortEcho('$variable');

        expect(echo).toContain('<?=');
        expect(echo).toContain('$variable');
        expect(echo).toContain('?>');
    });

    it('creates safe echo with htmlspecialchars', () => {
        const builder = createPhpBuilder();
        const safeEcho = builder.safeEcho('$user->name');

        expect(safeEcho).toBe('<?= htmlspecialchars($user->name, ENT_QUOTES, \'UTF-8\') ?>');
        expect(safeEcho).toContain('htmlspecialchars');
        expect(safeEcho).toContain('ENT_QUOTES');
        expect(safeEcho).toContain('UTF-8');
    });

    it('creates safe echo with data_get expression', () => {
        const builder = createPhpBuilder();
        const safeEcho = builder.safeEcho('data_get($user, \'profile.name\')');

        expect(safeEcho).toBe('<?= htmlspecialchars(data_get($user, \'profile.name\'), ENT_QUOTES, \'UTF-8\') ?>');
        expect(safeEcho).toMatch(/^<\?=/);
        expect(safeEcho).toMatch(/\?>$/);
    });

    it('creates safe expression without PHP tags', () => {
        const builder = createPhpBuilder();
        const safeExpr = builder.safeExpression('$user->name');

        expect(safeExpr).toBe('htmlspecialchars($user->name, ENT_QUOTES, \'UTF-8\')');
        expect(safeExpr).not.toContain('<?');
        expect(safeExpr).not.toContain('?>');
    });

    it('creates safe expression for use in concatenation', () => {
        const builder = createPhpBuilder();
        const safeExpr = builder.safeExpression('data_get($user, \'name\')');

        expect(safeExpr).toBe('htmlspecialchars(data_get($user, \'name\'), ENT_QUOTES, \'UTF-8\')');
        expect(safeExpr).toContain('htmlspecialchars');
        expect(safeExpr).toContain('ENT_QUOTES');
    });

    it('can be reset and reused', () => {
        const builder = new PhpBuilder();

        builder.openTag().strictTypes();
        expect(builder.build()).toContain('<?php');

        builder.reset();
        expect(builder.build()).toBe('');

        builder.line('test');
        expect(builder.build()).toBe('test');
    });

    it('can be created with factory function', () => {
        const builder = createPhpBuilder({ indentSpaces: 2 });
        expect(builder).toBeInstanceOf(PhpBuilder);
    });

    it('builds complex nested structure', () => {
        const builder = new PhpBuilder();

        const slotFunction = builder.anonymousFunction('', '', '{ ?>Hello<?php }');
        const componentCall = builder.componentCall(
            'App\\View\\Components\\Layout',
            "['title' => 'Welcome']",
            slotFunction
        );

        const result = builder
            .reset()
            .openTag()
            .emptyLine()
            .strictTypes()
            .emptyLine()
            .returnArrowFunction('', 'string', componentCall)
            .build();

        expect(result).toContain('<?php');
        expect(result).toContain('declare(strict_types=1);');
        expect(result).toContain('return static fn(): string =>');
        expect(result).toContain('componentClass: App\\View\\Components\\Layout::class');
        expect(result).toContain("props: ['title' => 'Welcome']");
        expect(result).toContain('slot: function() { ?>Hello<?php }');
    });

    it('resets the builder state', () => {
        const builder = new PhpBuilder();
        builder.openTag().strictTypes();
        expect(builder.build()).not.toBe('');

        builder.reset();
        expect(builder.build()).toBe('');
    });

    it('generates PHP statement block', () => {
        const builder = createPhpBuilder();
        const statement = builder.phpStatement('echo "Hello"');

        expect(statement).toBe('<?php echo "Hello"; ?>');
    });

    it('generates variable assignment', () => {
        const builder = createPhpBuilder();
        const assignment = builder.variableAssignment('$user', 'getUserData()');

        expect(assignment).toBe('<?php $user = getUserData(); ?>');
    });

    it('generates variable assignment with data_get', () => {
        const builder = createPhpBuilder();
        const assignment = builder.variableAssignment('$__user_name', 'data_get($user, \'name\')');

        expect(assignment).toBe('<?php $__user_name = data_get($user, \'name\'); ?>');
        // Verify it contains PHP tags
        expect(assignment).toMatch(/^<\?php/);
        expect(assignment).toMatch(/\?>$/);
    });

    it('generates foreach opening tag', () => {
        const builder = createPhpBuilder();
        const foreachOpen = builder.foreachOpen('$users', '$user');

        expect(foreachOpen).toBe('<?php foreach ($users as $user): ?>');
        expect(foreachOpen).toMatch(/^<\?php/);
        expect(foreachOpen).toMatch(/\?>$/);
    });

    it('generates foreach closing tag', () => {
        const builder = createPhpBuilder();
        const foreachClose = builder.foreachClose();

        expect(foreachClose).toBe('<?php endforeach; ?>');
        expect(foreachClose).toMatch(/^<\?php/);
        expect(foreachClose).toMatch(/\?>$/);
    });

    it('generates if opening tag', () => {
        const builder = createPhpBuilder();
        const ifOpen = builder.ifOpen('$user');

        expect(ifOpen).toBe('<?php if ($user): ?>');
        expect(ifOpen).toMatch(/^<\?php/);
        expect(ifOpen).toMatch(/\?>$/);
    });

    it('generates if opening tag with complex condition', () => {
        const builder = createPhpBuilder();
        const ifOpen = builder.ifOpen('!empty($user) && $user->isActive()');

        expect(ifOpen).toBe('<?php if (!empty($user) && $user->isActive()): ?>');
    });

    it('generates elseif tag', () => {
        const builder = createPhpBuilder();
        const elseif = builder.elseif('$status === "pending"');

        expect(elseif).toBe('<?php elseif ($status === "pending"): ?>');
        expect(elseif).toMatch(/^<\?php/);
        expect(elseif).toMatch(/\?>$/);
    });

    it('generates else tag', () => {
        const builder = createPhpBuilder();
        const elseTag = builder.else();

        expect(elseTag).toBe('<?php else: ?>');
        expect(elseTag).toMatch(/^<\?php/);
        expect(elseTag).toMatch(/\?>$/);
    });

    it('generates endif closing tag', () => {
        const builder = createPhpBuilder();
        const endif = builder.endif();

        expect(endif).toBe('<?php endif; ?>');
        expect(endif).toMatch(/^<\?php/);
        expect(endif).toMatch(/\?>$/);
    });
});
