<?php foreach ($users as $user): ?> <?= htmlspecialchars(data_get($user, 'name'), ENT_QUOTES, 'UTF-8') ?> <?php endforeach; ?>
