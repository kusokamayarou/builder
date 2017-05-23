<?php

namespace VisualComposer\Modules\Hub\Download;

if (!defined('ABSPATH')) {
    header('Status: 403 Forbidden');
    header('HTTP/1.1 403 Forbidden');
    exit;
}

use VisualComposer\Framework\Container;
use VisualComposer\Framework\Illuminate\Support\Module;
use VisualComposer\Helpers\Differ;
use VisualComposer\Helpers\Hub;
use VisualComposer\Helpers\Traits\EventsFilters;
use VisualComposer\Helpers\Traits\WpFiltersActions;

class BundleDownloadController extends Container implements Module
{
    use WpFiltersActions;
    use EventsFilters;

    public function __construct(Hub $hubHelper)
    {
        if (vcvenv('VCV_ELEMENT_DOWNLOAD')) {
            $this->addFilter(
                'vcv:ajax:account:activation:adminNonce',
                'downloadOnActivation',
                50
            );
        }
    }

    protected function downloadOnActivation($response, $payload)
    {
        if ($response) {
            /** @see \VisualComposer\Modules\Hub\Download\BundleDownloadController::prepareBundleDownload */
            $this->call('prepareBundleDownload');
        }

        return $response;
    }

    protected function prepareBundleDownload(Hub $hubHelper)
    {
        $hubHelper->removeTempBundleFolder();
        $archive = $hubHelper->requestBundleDownload();

        if (!is_wp_error($archive)) {
            $archive = $this->readBundleJson($archive);
            if (!is_wp_error($archive)) {
                $this->processBundleJson($archive);
            }
        }
        // clean-up
        $hubHelper->removeTempBundleFolder();

        return $archive;
    }

    protected function readBundleJson($archive)
    {
        $hubHelper = vchelper('Hub');
        $result = $hubHelper->unzipDownloadedBundle($archive);
        if (!is_wp_error($result)) {
            return $hubHelper->readBundleJson($hubHelper->getBundleFolder('bundle.json'));
        }

        return $result;
    }

    protected function processBundleJson($bundleJson)
    {
        // process elements
        $this->updateElements($bundleJson);
        // process categories
        $this->updateCategories($bundleJson);
        // process groups
        $this->updateGroups($bundleJson);
    }

    protected function updateElements($bundleJson)
    {
        $hubHelper = vchelper('Hub');
        /** @var Differ $elementsDiffer */
        $hubElements = $hubHelper->getElements();

        $elementsDiffer = vchelper('Differ');
        if (!empty($hubElements)) {
            $elementsDiffer->set($hubElements);
        }

        $fileHelper = vchelper('File');
        $fileHelper->createDirectory($hubHelper->getElementPath());
        $elementsDiffer->onUpdate(
            [$hubHelper, 'updateElement']
        )->set(
            $bundleJson['elements']
        );
        $hubHelper->setElements($elementsDiffer->get());
    }

    protected function updateCategories($bundleJson)
    {
        $hubHelper = vchelper('Hub');
        /** @var Differ $categoriesDiffer */
        $hubCategories = $hubHelper->getCategories();

        $categoriesDiffer = vchelper('Differ');
        if (!empty($hubCategories)) {
            $categoriesDiffer->set($hubCategories);
        }

        $fileHelper = vchelper('File');
        $fileHelper->createDirectory($hubHelper->getCategoriesPath());
        $fileHelper->copyDirectory($hubHelper->getBundleFolder('categories'), $hubHelper->getCategoriesPath(), false);
        $categoriesDiffer->onUpdate(
            [$hubHelper, 'updateCategory']
        )->set(
            $bundleJson['categories']
        );
        $hubHelper->setCategories($categoriesDiffer->get());
    }

    protected function updateGroups($bundleJson)
    {
        $hubHelper = vchelper('Hub');
        /** @var Differ $groupsDiffer */
        $hubGroups = $hubHelper->getGroups();

        $groupsDiffer = vchelper('Differ');
        if (!empty($hubGroups)) {
            $groupsDiffer->set($hubGroups);
        }

        $groupsDiffer->onUpdate(
            [$hubHelper, 'updateGroup']
        )->set(
            $bundleJson['groups']
        );
        $hubHelper->setGroups($groupsDiffer->get());
    }
}
