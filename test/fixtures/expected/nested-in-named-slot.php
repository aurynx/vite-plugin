<?php
return static fn(): string => component(
  componentClass: App\View\Components\Card::class,
  slots: [
    'header' => function() {
    echo component(componentClass: App\View\Components\Heading::class);
    }
  ],
  slot: function() { ?>Content here<?php },
);
