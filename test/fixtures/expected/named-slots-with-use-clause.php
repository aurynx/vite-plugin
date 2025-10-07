<?php

declare(strict_types=1);

return static function (array $__data): string {
    $code = $__data['code'] ?? null;
    $message = $__data['message'] ?? null;

    return component(
  componentClass: App\View\Components\Alert::class,
  slots: [
    'title' => static function() use ($code): string { ?>Error: <?= htmlspecialchars($code, ENT_QUOTES, 'UTF-8') ?><?php }
  ],
  slot: static function() use ($message): string { ?>Message: <?= htmlspecialchars($message, ENT_QUOTES, 'UTF-8') ?><?php },
);
};
