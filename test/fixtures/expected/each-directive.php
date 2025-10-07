<?php

declare(strict_types=1);

return static function (array $__data): string {
    $users = $__data['users'] ?? null;
    return ($users ? ' ' . implode('', array_map(static fn(mixed $user): string => ' ' . (htmlspecialchars(data_get($user, 'name'), ENT_QUOTES, 'UTF-8')) . ' ', $users)) . ' ' : '');
};
