<?php
return static fn(): string => component(
  componentClass: App\View\Components\Alert::class,
  slots: [
    'title' => function() { ?>Server Error<?php }
  ],
);
