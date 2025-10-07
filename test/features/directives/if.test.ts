import { describe, it, expect } from 'vitest';
import { compile } from '@/compiler';

const baseNamespace = 'App\\View\\Components';

describe('If Directives', () => {
    it('compiles @if/@endif directive', () => {
        const template = `
@if($user)
    <p>Hello, {{ $user->name }}</p>
@endif
`;

        const result = compile(template, baseNamespace);

        expect(result).toContain('<?php if ($user): ?>');
        expect(result).toContain('<?php endif; ?>');
        expect(result).toContain('htmlspecialchars($user->name');
    });

    it('compiles @if/@else/@endif directive', () => {
        const template = `
@if($isLoggedIn)
    <p>Welcome back!</p>
@else
    <p>Please log in</p>
@endif
`;

        const result = compile(template, baseNamespace);

        expect(result).toContain('<?php if ($isLoggedIn): ?>');
        expect(result).toContain('<?php else: ?>');
        expect(result).toContain('<?php endif; ?>');
    });

    it('compiles @if/@elseif/@else/@endif directive', () => {
        const template = `
@if($status === 'active')
    <span class="badge-success">Active</span>
@elseif($status === 'pending')
    <span class="badge-warning">Pending</span>
@else
    <span class="badge-danger">Inactive</span>
@endif
`;

        const result = compile(template, baseNamespace);

        expect(result).toContain('<?php if ($status === \'active\'): ?>');
        expect(result).toContain('<?php elseif ($status === \'pending\'): ?>');
        expect(result).toContain('<?php else: ?>');
        expect(result).toContain('<?php endif; ?>');
    });

    it('compiles multiple @elseif conditions', () => {
        const template = `
@if($score >= 90)
    <p>Grade: A</p>
@elseif($score >= 80)
    <p>Grade: B</p>
@elseif($score >= 70)
    <p>Grade: C</p>
@else
    <p>Grade: F</p>
@endif
`;

        const result = compile(template, baseNamespace);

        expect(result).toContain('<?php if ($score >= 90): ?>');
        expect(result).toContain('<?php elseif ($score >= 80): ?>');
        expect(result).toContain('<?php elseif ($score >= 70): ?>');
        expect(result).toContain('<?php else: ?>');
        expect(result).toContain('<?php endif; ?>');
    });

    it('compiles nested @if directives', () => {
        const template = `
@if($user)
    @if($user->isAdmin)
        <p>Admin Panel</p>
    @endif
@endif
`;

        const result = compile(template, baseNamespace);

        const ifCount = (result.match(/<?php if \(/g) || []).length;
        const endifCount = (result.match(/<?php endif; \?>/g) || []).length;

        expect(ifCount).toBe(2);
        expect(endifCount).toBe(2);
    });

    it('compiles @if with complex expression', () => {
        const template = `
@if(!empty($user) && $user->isActive())
    <p>Active user</p>
@endif
`;

        const result = compile(template, baseNamespace);

        expect(result).toContain('<?php if (!empty($user) && $user->isActive()): ?>');
        expect(result).toContain('<?php endif; ?>');
    });

    it('compiles @if with dot notation', () => {
        const template = `
@if($user.profile.verified)
    <span class="verified-badge">✓</span>
@endif
`;

        const result = compile(template, baseNamespace);

        // Dot notation should be converted to data_get
        expect(result).toContain('data_get($user, \'profile.verified\')');
        expect(result).toContain('<?php if (');
        expect(result).toContain('<?php endif; ?>');
    });
});
