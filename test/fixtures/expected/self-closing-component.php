<?php
return static function (): string {
    ob_start();
?>
<?= component(componentClass: App\View\Components\Alert::class) ?>
<?php
    return ob_get_clean();
};
