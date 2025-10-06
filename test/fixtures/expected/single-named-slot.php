<?php
return static function (): string {
    ob_start();
?>
<?=
component(
  componentClass: App\View\Components\Alert::class,
  slots: [
    'title' => function() { ?>Server Error<?php }
  ],
)
?>
<?php
    return ob_get_clean();
};
