<?php
return static function(array $__data): string {
    extract($__data, EXTR_SKIP);
    ob_start();
    ?>
<?= component(componentClass: App\View\Components\Layout::class, props: ['title' => 'Welcome Page'], slot: function() { ?><div class="container">
        <h2>Welcome to our shop!</h2>
        <p>Check out our amazing products.</p>
        <?= component(componentClass: App\View\Components\Button::class, slot: function() { ?>Shop Now<?php }) ?>
    </div><?php }) ?>
    <?php
    return ob_get_clean();
};
