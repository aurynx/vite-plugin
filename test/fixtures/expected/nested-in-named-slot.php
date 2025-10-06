<?php
return static function(array $__data): string {
    extract($__data, EXTR_SKIP);
    ob_start();
    ?>
<?= component(componentClass: App\View\Components\Card::class, slots: ['header' => function() { ?><?= component(componentClass: App\View\Components\Heading::class) ?><?php }], slot: function() { ?>Content here<?php }) ?>
    <?php
    return ob_get_clean();
};
