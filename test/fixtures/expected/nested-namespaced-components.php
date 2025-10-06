<?php

declare(strict_types=1);

return static fn(): string => component(
  componentClass: App\View\Components\Layout::class,
  slot: function() {
    echo component(
      componentClass: App\View\Components\Card::class,
      slot: function() {
        echo component(componentClass: App\View\Components\Card\Header::class);
        echo component(componentClass: App\View\Components\Card\Body::class);
        echo component(componentClass: App\View\Components\Card\Footer::class);
      },
    );
  },
);
