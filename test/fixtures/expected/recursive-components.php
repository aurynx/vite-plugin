<?php
return static fn(): string => component(
  componentClass: App\View\Components\Layout::class,
  slot: function() {
    echo component(componentClass: App\View\Components\Card::class);
  },
);
