<?php

declare(strict_types=1);

return static function (array $__data): string {
    $code = $__data['code'] ?? null;
    $message = $__data['message'] ?? null;

    ob_start();
?>
<?=
component(
  componentClass: App\View\Components\Alert::class,
  slots: [
    'title' => function() use ($code) { ?>Error: <?= htmlspecialchars($code, ENT_QUOTES, 'UTF-8') ?><?php }
  ],
  slot: function() use ($message) { ?>Message: <?= htmlspecialchars($message, ENT_QUOTES, 'UTF-8') ?><?php },
)
?>
<?php
    return ob_get_clean();
};
