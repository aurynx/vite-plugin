<?php

declare(strict_types=1);

return static function (array $__data): string {
    $cart = $__data['cart'] ?? null;

    ob_start();
?>
<?php /* A template to test deep dot notation */ ?>
<h1>Cart Summary</h1>

<?php if (!empty(data_get($cart, 'items'))): ?>
<p>Total items: <?= htmlspecialchars(data_get($cart, 'total_items'), ENT_QUOTES, 'UTF-8') ?></p>
<ul>
    <?php foreach (data_get($cart, 'items') as $item): ?>
    <li>
        <?= htmlspecialchars(data_get($item, 'product.name'), ENT_QUOTES, 'UTF-8') ?> - <?= htmlspecialchars(data_get($item, 'quantity'), ENT_QUOTES, 'UTF-8') ?> pcs.
        <?php if (data_get($item, 'product.is_digital')): ?>
        <em>(Digital Download)</em>
        <?php endif; ?>
    </li>
    <?php endforeach; ?>
</ul>
<?php else: ?>
<p>Your cart is empty.</p>
<?php endif; ?>
<?php
    return ob_get_clean();
};
