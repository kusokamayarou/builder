<?php
if (!defined('ABSPATH')) {
    die('-1');
}

vcview('settings/partials/admin-nonce');
?>
<div class="wrap vcv-settings">
    <?php echo $content ?>
</div>