<?php

declare(strict_types=1);

return static fn(): string => component(
  componentClass: App\View\Components\Card::class,
  slot: static fn(): string => component(componentClass: App\View\Components\Button::class, slot: 'Click'),
);
