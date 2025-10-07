<?php

declare(strict_types=1);

return static fn(): string => component(componentClass: App\View\Components\Layout::class, props: ['title' => 'Home Page - Aurynx'], slot: '<div style="padding: 2rem; text-align: center;">\n        <h1 style="font-size: 2.5rem; font-weight: bold;">Welcome to the Aurynx Framework</h1>\n        <p style="margin-top: 1rem; font-size: 1.2rem;">The component system is up and running!</p>\n    </div>');
