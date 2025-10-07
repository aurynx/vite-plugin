<?php

declare(strict_types=1);

return static fn(): string => component(
  componentClass: App\View\Components\Alert::class,
  slots: [
    'title' => 'Server Error'
  ],
  slot: '<strong>Whoops!</strong> Something went wrong!',
);
