<?php
return static function (): string {
    // No variables used

    ob_start();
?>
<?= component(componentClass: App\View\Components\Layout::class, slot: function() { ?>
  <?= component(componentClass: App\View\Components\Card::class, slot: function() { ?>
    <?= component(componentClass: App\View\Components\Card\Header::class) ?>
    <?= component(componentClass: App\View\Components\Card\Body::class) ?>
    <?= component(componentClass: App\View\Components\Card\Footer::class) ?>
  <?php }) ?>
<?php }) ?>
<?php
    return ob_get_clean();
};
