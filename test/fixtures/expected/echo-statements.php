<?php
return static function (array $__data): string {
    $name = $__data['name'] ?? null;
    $raw_html = $__data['raw_html'] ?? null;

    ob_start();
?>
Hello, <?= htmlspecialchars($name, ENT_QUOTES, 'UTF-8') ?>. Raw: <?= $raw_html ?>
<?php
    return ob_get_clean();
};
