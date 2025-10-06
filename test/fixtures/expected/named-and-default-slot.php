<?php
return static function(array $__data): string {
    extract($__data, EXTR_SKIP);
    ob_start();
    ?>
<?= component(componentClass: App\View\Components\Alert::class, slots: ['title' => function() { ?>Server Error<?php }], slot: function() { ?><strong>Whoops!</strong> Something went wrong!<?php }) ?>
    <?php
    return ob_get_clean();
};
