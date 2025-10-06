<?php
return static function (): string {
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
