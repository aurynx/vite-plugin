<?php
return static function (): string {
    // No variables used

    ob_start();
?>
<?=
component(
  componentClass: App\View\Components\Card::class,
  slots: [
    'header' => function() {
    echo component(componentClass: App\View\Components\Heading::class);
    }
  ],
  slot: function() { ?>Content here<?php },
)
?>
<?php
    return ob_get_clean();
};
