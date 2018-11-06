<?php

namespace VisualComposer\Modules\Hub\Download;

if (!defined('ABSPATH')) {
    header('Status: 403 Forbidden');
    header('HTTP/1.1 403 Forbidden');
    exit;
}

use VisualComposer\Framework\Container;
use VisualComposer\Framework\Illuminate\Support\Module;
use VisualComposer\Helpers\Options;
use VisualComposer\Helpers\Request;
use VisualComposer\Helpers\Traits\EventsFilters;
use VisualComposer\Helpers\Traits\WpFiltersActions;

class BundleUpdateController extends Container implements Module
{
    use EventsFilters;
    use WpFiltersActions;

    public function __construct()
    {
        $this->addEvent('vcv:admin:inited vcv:system:activation:hook', 'checkForUpdate');
        $this->wpAddAction('admin_menu', 'checkForUpdate', 9);
        /** @see \VisualComposer\Modules\Hub\Download\BundleUpdateController::checkVersion */
        $this->addFilter('vcv:hub:update:checkVersion', 'checkVersion');
        $this->addFilter('vcv:editors:frontend:render', 'checkForUpdate', -1);
        //            $this->addFilter('vcv:ajax:bundle:update:finished:adminNonce', 'finishUpdate');
        $this->addEvent('vcv:system:factory:reset', 'unsetOptions');
    }

    protected function checkForUpdate(Options $optionsHelper, $response = '')
    {
        if ($optionsHelper->getTransient('lastBundleUpdate') < time()) {
            $result = vcfilter('vcv:hub:update:checkVersion', '');
            if (!vcIsBadResponse($result)) {
                $optionsHelper->setTransient('lastBundleUpdate', time() + DAY_IN_SECONDS);
            } else {
                //if failed try one more time after one hour
                $optionsHelper->setTransient('lastBundleUpdate', time() + 3600);
            }
        }

        return $response;
    }

    protected function checkVersion($response, $payload)
    {
        $optionsHelper = vchelper('Options');
        if ($optionsHelper->getTransient('bundleUpdateJson')) {
            return ['status' => true, 'json' => $optionsHelper->getTransient('bundleUpdateJson')];
        }
        $hubBundleHelper = vchelper('HubBundle');
        $licenseHelper = vchelper('License');
        $tokenHelper = vchelper('Token');
        $noticeHelper = vchelper('Notice');
        $token = $tokenHelper->createToken();
        // TODO: Errors
        if (!vcIsBadResponse($token)) {
            $url = $hubBundleHelper->getJsonDownloadUrl(['token' => $token]);
            $json = $hubBundleHelper->getRemoteBundleJson($url);
            if ($json) {
                return $this->processJson($json);
            } else {
                return ['status' => false];
            }
        } elseif ($licenseHelper->isActivated() && isset($token['code'])) {
            $licenseHelper->setKey('');
            $noticeHelper->addNotice('premium:deactivated', $licenseHelper->licenseErrorCodes($token['code']));
        }

        return ['status' => false];
    }

    protected function finishUpdate($response, $payload, Request $requestHelper, Options $optionsHelper)
    {
        // TODO: another transient
        $currentTransient = $optionsHelper->getTransient('vcv:activation:request');
        if ($currentTransient) {
            if ($currentTransient !== $requestHelper->input('vcv-time')) {
                return ['status' => false];
            } else {
                // Reset bundles from activation
                $optionsHelper->deleteTransient('vcv:activation:request');
            }
        }
        $optionsHelper->set('bundleUpdateRequired', false);

        return [
            'status' => true,
        ];
    }

    /**
     * @param $json
     *
     * @return bool|array
     * @throws \ReflectionException
     */
    protected function processJson($json)
    {
        if (is_array($json) && isset($json['actions'])) {
            $this->call('processTeasers', [$json['actions']]);
            $optionsHelper = vchelper('Options');
            $hubUpdateHelper = vchelper('HubUpdate');
            if ($hubUpdateHelper->checkIsUpdateRequired($json)) {
                $optionsHelper->set('bundleUpdateRequired', true);
                // Save in database cache for 30m
                $optionsHelper->setTransient('bundleUpdateJson', $json, 1800);
            }

            return ['status' => true, 'json' => $json];
        }

        return false;
    }

    protected function processTeasers($actions)
    {
        if (isset($actions['hubTeaser'])) {
            vcevent('vcv:hub:process:action:hubTeaser', ['teasers' => $actions['hubTeaser']]);
        }
        if (isset($actions['hubAddons'])) {
            vcevent('vcv:hub:process:action:hubAddons', ['teasers' => $actions['hubAddons']]);
        }
        if (isset($actions['hubTemplates'])) {
            vcevent('vcv:hub:process:action:hubTemplates', ['teasers' => $actions['hubTemplates']]);
        }
    }

    protected function unsetOptions(Options $optionsHelper)
    {
        $optionsHelper
            ->delete('bundleUpdateRequired')
            ->delete('bundleUpdateActions')
            ->delete('bundleUpdateJson')
            ->deleteTransient('bundleUpdateJson')
            ->deleteTransient('lastBundleUpdate');
    }
}
