<?php
return static function (array $__data): string {
    $items = $__data['items'] ?? null;
    $title = $__data['title'] ?? null;

    ob_start();
?>
<?=
component(
  componentClass: App\View\Components\Container::class,
  slot: function() use ($items, $title) { ?><h2><?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?></h2>
<?php foreach ($items as $item): ?><p><?= htmlspecialchars(data_get($item, 'name'), ENT_QUOTES, 'UTF-8') ?></p>
<?php endforeach; ?><?php },
)
?>
<?php
    return ob_get_clean();
};
