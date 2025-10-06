<?php
return static function (): string {
    // No variables used

    ob_start();
?>
<?= component(componentClass: App\View\Components\Layout::class, slot: function() { ?><?= component(componentClass: App\View\Components\Card::class) ?><?php }) ?>
<?php
    return ob_get_clean();
};
