<?php

declare(strict_types=1);

return static function (array $__data): string {
    $post = $__data['post'] ?? null;

    return (component(componentClass: App\View\Components\Card::class, props: ['title' => 'Static Title', 'post' => $post, 'required' => 'true'])) . '\n';
};
