<?php
return static function(array $__data): string {
    extract($__data, EXTR_SKIP);
    ob_start();
    ?>
<!DOCTYPE html>
<html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title><?= htmlspecialchars($title) ?></title>
        <?php /* Here we will later add links to CSS/JS from Vite */ ?>
    </head>
    <body>
        <header>
            <h1>My Awesome Shop</h1>
            <nav>
                <a href="/">Home</a>
                <a href="/about">About</a>
            </nav>
        </header>
        <main>
            <?php if (isset($slot)) { echo ($slot)(); } ?>
        </main>
        <footer>
            <p>&copy; <?= date('Y') ?> My Awesome Shop. All rights reserved.</p>
        </footer>
    </body>
</html>
    <?php
    return ob_get_clean();
};
