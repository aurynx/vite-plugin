<?= component(componentClass: App\View\Components\Layout::class, slot: function() { ?><?= component(componentClass: App\View\Components\Card::class, slot: function() { ?><?= component(componentClass: App\View\Components\Card\Header::class) ?>
    <?= component(componentClass: App\View\Components\Card\Body::class) ?>
    <?= component(componentClass: App\View\Components\Card\Footer::class) ?><?php }) ?><?php }) ?>
