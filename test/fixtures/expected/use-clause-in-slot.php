<?php

declare(strict_types=1);

return static function (array $__data): string {
    $author = $__data['author'] ?? null;
    $post = $__data['post'] ?? null;

    return component(
  componentClass: App\View\Components\Card::class,
  slot: static function() use ($author, $post): string { ?><?= htmlspecialchars(data_get($post, 'title'), ENT_QUOTES, 'UTF-8') ?> by <?= htmlspecialchars($author->name, ENT_QUOTES, 'UTF-8') ?><?php },
);
};
