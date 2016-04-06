<?php

namespace VisualComposer\Modules\Elements\AjaxShortcodeRender;

use VisualComposer\Framework\Illuminate\Support\Module;
use VisualComposer\Helpers\Request;
use VisualComposer\Framework\Container;

/**
 * Class Controller
 * @package VisualComposer\Modules\Elements\AjaxShortcodeRender
 */
class Controller extends Container implements Module
{
    /**
     * Controller constructor.
     */
    public function __construct()
    {
        add_action(
            'vcv:ajax:loader:elements:ajaxShortcodeRender',
            function () {
                /** @see \VisualComposer\Modules\Elements\AjaxShortcodeRender\Controller::ajaxShortcodeRender */
                $this->call('ajaxShortcodeRender');
            }
        );
    }

    /**
     * @param \VisualComposer\Helpers\Request $request
     */
    private function ajaxShortcodeRender(Request $request)
    {
        // @todo add _nonce, check access
        $content = do_shortcode($request->input('vcv-shortcode-string'));
        wp_print_head_scripts();
        wp_print_footer_scripts();
        die($content);
    }
}
