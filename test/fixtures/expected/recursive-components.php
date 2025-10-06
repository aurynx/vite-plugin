<?php
return static function(array $__data): string {
    extract($__data, EXTR_SKIP);
    ob_start();
    ?>
<?= component(componentClass: App\View\Components\Layout::class, slot: function() { ?><?= component(componentClass: App\View\Components\Card::class) ?><?php }) ?>
    <?php
    return ob_get_clean();
};
