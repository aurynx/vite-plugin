<?php

declare(strict_types=1);

return static function (array $__data): string {
    $users = $__data['users'] ?? null;

    return component(
  componentClass: App\View\Components\Layout::class,
  props: ['title' => 'User List Page'],
  slot: static function() use ($users): string { ?>
    <?php /* This is a template to showcase the new dot notation and directives. */ ?>
    <h1>User List</h1>

    <?php if (!empty($users)): ?>
    <div class="user-grid">
        <?php foreach ($users as $user): ?>
    $__user_status = data_get($user, 'status');
    $__user_name = data_get($user, 'name');
        <div class="user-card">
            <?php if ($__user_status === 'active'): ?>
            <strong class="status--active"><?= htmlspecialchars($__user_name, ENT_QUOTES, 'UTF-8') ?></strong>
            <?php elseif ($__user_status === 'pending'): ?>
            <em class="status--pending"><?= htmlspecialchars($__user_name, ENT_QUOTES, 'UTF-8') ?> (Pending Review)</em>
            <?php else: ?>
            <?php /* Using raw echo for demonstration */ ?>
            <del class="status--inactive"><?= $__user_name ?> (Banned)</del>
            <?php endif; ?>
        </div>
        <?php endforeach; ?>
    </div>
    <?php else: ?>
    <p>No users found.</p>
    <?php endif; ?>
<?php },
);
};
