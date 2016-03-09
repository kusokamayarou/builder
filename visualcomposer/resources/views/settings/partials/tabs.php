<?php

if (!defined('ABSPATH')) {
    die('-1');
}

$urlFunction = is_network_admin() ? 'network_admin_url' : 'admin_url';

?>
<h2 class="nav-tab-wrapper">
    <?php foreach ($tabs as $tab) : ?>
        <?php

        if (isset($tab['showTab']) && !$tab['showTab']) {
            continue;
        }

        $page = 'admin.php?page=' . rawurlencode($tab['slug']);

        $url = call_user_func($urlFunction, $page);

        $class = 'nav-tab';

        if ($tab['slug'] === $activeSlug) {
            $class .= ' ' . (' nav-tab-active');
        }

        ?>
        <a href="<?= esc_attr($url) ?>" class="<?= esc_attr($class) ?>">
            <?= $tab['title'] ?>
        </a>
        <?php
    endforeach ?>
</h2>