<?php
return static function(array $__data): string {
    extract($__data, EXTR_SKIP);
    ob_start();
    ?>
User: <?= htmlspecialchars(data_get($user, 'name'), ENT_QUOTES, 'UTF-8') ?>
    <?php
    return ob_get_clean();
};
