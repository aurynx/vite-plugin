<?php
return static function(array $__data): string {
    extract($__data, EXTR_SKIP);
    ob_start();
    ?>
<?php foreach ($users as $user): ?> <?= htmlspecialchars(data_get($user, 'name'), ENT_QUOTES, 'UTF-8') ?> <?php endforeach; ?>
    <?php
    return ob_get_clean();
};
