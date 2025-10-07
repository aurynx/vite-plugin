<?php

declare(strict_types=1);

return static fn(): string => component(componentClass: App\View\Components\Card::class, slot: '<p>Hello World</p>');
