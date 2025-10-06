<?php
return static function(array $__data): string {
    extract($__data, EXTR_SKIP);
    ob_start();
    ?>
<?= component(componentClass: App\View\Components\Card::class, slot: function() use ($author, $post) { ?><?= htmlspecialchars(data_get($post, 'title'), ENT_QUOTES, 'UTF-8') ?> by <?= htmlspecialchars($author->name, ENT_QUOTES, 'UTF-8') ?><?php }) ?>
    <?php
    return ob_get_clean();
};
