<?php
return static function(array $__data): string {
    extract($__data, EXTR_SKIP);
    ob_start();
    ?>
<?= component(componentClass: App\View\Components\Card::class, props: ['title' => 'Static Title', 'post' => $post, 'required' => 'true']) ?>
    <?php
    return ob_get_clean();
};
