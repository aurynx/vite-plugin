<?php
return static function (array $__data): string {
    // No variables used

    ob_start();
?>
<?= component(componentClass: App\View\Components\Card::class, slots: ['header' => function() { ?><?= component(componentClass: App\View\Components\Heading::class) ?><?php }], slot: function() { ?>Content here<?php }) ?>
<?php
    return ob_get_clean();
};
