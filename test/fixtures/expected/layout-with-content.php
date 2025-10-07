<?php

declare(strict_types=1);

return static fn(): string => component(
  componentClass: App\View\Components\Layout::class,
  props: ['title' => 'Welcome Page'],
  slot: static function (): string { ?>
    <div class="container">
        <h2>Welcome to our shop!</h2>
        <p>Check out our amazing products.</p>
        <?= component(componentClass: App\View\Components\Button::class, slot: 'Shop Now') ?>
    </div>
<?php },
);
