<?php

declare(strict_types=1);

return static function (array $__data): string {
    $name = $__data['name'] ?? null;
    $raw_html = $__data['raw_html'] ?? null;

    return 'Hello, ' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . '. Raw: ' . $raw_html . PHP_EOL;
};
