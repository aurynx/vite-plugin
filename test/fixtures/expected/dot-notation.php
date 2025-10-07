<?php

declare(strict_types=1);

return static function (array $__data): string {
    $user = $__data['user'] ?? null;

    return 'User: ' . htmlspecialchars(data_get($user, 'name'), ENT_QUOTES, 'UTF-8') . PHP_EOL;
};
