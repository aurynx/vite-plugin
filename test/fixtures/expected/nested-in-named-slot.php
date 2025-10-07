<?php

declare(strict_types=1);

return static fn(): string => component(
  componentClass: App\View\Components\Card::class,
  slots: [
    'header' => static fn(): string => component(componentClass: App\View\Components\Heading::class)
  ],
  slot: 'Content here',
);
