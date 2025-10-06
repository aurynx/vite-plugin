<?php
return static function(array $__data): string {
    $users = $__data['users'] ?? null;

    ob_start();
    ?>
<?php foreach ($users as $user): ?> <?= htmlspecialchars(data_get($user, 'name'), ENT_QUOTES, 'UTF-8') ?> <?php endforeach; ?>
    <?php
    return ob_get_clean();
};
