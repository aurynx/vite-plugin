<?php
return static function(array $__data): string {
    extract($__data, EXTR_SKIP);
    ob_start();
    ?>
Hello, <?= htmlspecialchars($name, ENT_QUOTES, 'UTF-8') ?>. Raw: <?= $raw_html ?>
    <?php
    return ob_get_clean();
};
