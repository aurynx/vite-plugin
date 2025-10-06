<?php
return static function (): string {
    // No variables used

    ob_start();
?>
<?=
component(
  componentClass: App\View\Components\Layout::class,
  slot: function() {
    echo component(componentClass: App\View\Components\Card::class);
  }
)
?>
<?php
    return ob_get_clean();
};
