<?php

namespace VisualComposer\Helpers\Hub;

if (!defined('ABSPATH')) {
    header('Status: 403 Forbidden');
    header('HTTP/1.1 403 Forbidden');
    exit;
}

use VisualComposer\Framework\Illuminate\Support\Helper;

class Categories implements Helper
{
    protected $thirdPartyCategoriesElements = [];

    public function addCategoryElements($category, $elements)
    {
        if (!isset($this->thirdPartyCategoriesElements[ $category ])) {
            $this->thirdPartyCategoriesElements[ $category ] = ['elements' => []];
        }
        $this->thirdPartyCategoriesElements[ $category ]['elements'] = array_merge(
            $this->thirdPartyCategoriesElements[ $category ]['elements'],
            $elements
        );
    }

    protected function updateStoredCategories($defaultCategories, $storedInDbCategories)
    {
        $searchInArray = function ($array, $key, $value) {
            foreach ($array as $index => $data) {
                if (isset($data[ $key ]) && in_array($value, $data[ $key ], true)) {
                    return $index;
                }
            }

            return false;
        };
        $changesInStoredDb = false;
        if (!empty($storedInDbCategories)) {
            foreach ($storedInDbCategories as $categoryName => $data) {
                foreach ($data['elements'] as $index => $element) {
                    $inArray = $searchInArray($defaultCategories, 'elements', $element);
                    if ($inArray !== false) {
                        // Already stored inside default hub categories
                        // Remove it!
                        unset($storedInDbCategories[ $categoryName ]['elements'][ $index ]);
                        $changesInStoredDb = true;
                    }
                }
                if (
                    !isset($storedInDbCategories[ $categoryName ]['elements'])
                    || empty($storedInDbCategories[ $categoryName ]['elements'])
                ) {
                    // If stored category is empty, just remove it
                    unset($storedInDbCategories[ $categoryName ]);
                    $changesInStoredDb = true;
                }
            }
        }

        return ['changesInStoredDb' => $changesInStoredDb, 'storedInDbCategories' => $storedInDbCategories];
    }

    /**
     * Return all default elements, stored in db and 3rd party categories
     * @return array
     */
    public function getCategories()
    {
        $categoriesDiffer = vchelper('Differ');
        $hubCategories = $this->getHubCategories();
        $hubCategories = vcfilter('vcv:helpers:hub:getCategories', $hubCategories);
        $categoriesDiffer->set($hubCategories);
        $updateThirdParty = $this->updateStoredCategories($hubCategories, $this->thirdPartyCategoriesElements);
        // Add 3rd Party elements
        $categoriesDiffer->onUpdate(
            function ($key, $oldValue, $newValue, $mergedValue) {
                if (empty($oldValue)) {
                    return []; // Do not allow to create 'new' categories
                }
                $mergedValue['elements'] = array_values(
                    array_unique(array_merge($oldValue['elements'], $newValue['elements']))
                );

                return $mergedValue;
            }
        )->set(
            $updateThirdParty['storedInDbCategories']
        );
        $new = $categoriesDiffer->get();

        return $new;
    }

    public function setCategories($categories = [])
    {
        $optionHelper = vchelper('Options');

        return $optionHelper->set('hubCategories', $categories);
    }

    public function updateCategory($key, $prev, $new, $merged)
    {
        $categoryUrl = rtrim($this->getCategoriesUrl(), '\\/');
        $dataHelper = vchelper('Data');
        if (isset($merged['icon'])) {
            $merged['icon'] = str_replace(
                '[publicPath]',
                $categoryUrl,
                $merged['icon']
            );
        }
        if (isset($merged['icon'])) {
            $merged['iconDark'] = str_replace(
                '[publicPath]',
                $categoryUrl,
                $merged['iconDark']
            );
        }

        if (!empty($prev)) {
            if (isset($new['elements']) && is_array($new['elements']) && isset($prev['elements'])) {
                $merged['elements'] = array_values(
                    $dataHelper->arrayDeepUnique(array_merge($prev['elements'], $new['elements']))
                );
            }
        }

        return $merged;
    }

    public function getCategoriesPath($key = '')
    {
        return VCV_PLUGIN_ASSETS_DIR_PATH . '/categories/' . ltrim($key, '\\/');
    }

    public function getCategoriesUrl($key = '')
    {
        $assetsHelper = vchelper('Assets');

        return $assetsHelper->getAssetUrl('/categories/' . ltrim($key, '\\/'));
    }

    /**
     * Return all default elements and stored in DB elements categories.
     * @return array
     */
    public function getHubCategories()
    {
        $optionHelper = vchelper('Options');
        $urlHelper = vchelper('Url');
        $categoriesDiffer = vchelper('Differ');
        $hubCategoriesHelper = vchelper('HubCategories');

        $defaultCategories = [
            'Row' => [
                'title' => 'Row/Column',
                'elements' => ['row', 'grid'],
                'icon' => $urlHelper->to('public/categories/icons/Row.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Row.svg'),
            ],
            'Column' => [
                'title' => 'Column',
                'elements' => ['column', 'gridItem'],
                'icon' => $urlHelper->to('public/categories/icons/Column.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Column.svg'),
            ],
            'Tabs' => [
                'title' => 'Tabs',
                'elements' => [
                    'tabsWithSlide',
                    'classicTabs',
                    'pageableContainer',
                    'contentSlider',
                    'toggleContainer',
                ],
                'icon' => $urlHelper->to('public/categories/icons/Container.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Container.svg'),
            ],
            'FAQ Group' => [
                'title' => 'FAQ Group',
                'elements' => ['faqGroup'],
                'icon' => $urlHelper->to('public/categories/icons/Container.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Container.svg'),
            ],
            'Tab' => [
                'title' => 'Tab',
                'elements' => [
                    'tab',
                    'classicTab',
                    'pageableTab',
                    'contentSlide',
                    'toggleContainerTab',
                ],
                'icon' => $urlHelper->to('public/categories/icons/Container.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Container.svg'),
            ],
            'Basic Button' => [
                'title' => 'Basic Button',
                'elements' => ['basicButton'],
                'icon' => $urlHelper->to('public/categories/icons/Button.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Button.svg'),
            ],
            'Outline Button' => [
                'title' => 'Outline Button',
                'elements' => ['outlineButton'],
                'icon' => $urlHelper->to('public/categories/icons/Button.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Button.svg'),
            ],
            'Button Group' => [
                'title' => 'Button Group',
                'elements' => ['buttonGroup'],
                'icon' => $urlHelper->to('public/categories/icons/Button.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Button.svg'),
            ],
            'Buttons' => [
                'title' => 'Buttons',
                'elements' => [
                    'basicButtonIcon',
                    'outlineButtonIcon',
                    'gradientButton',
                    'animatedOutlineButton',
                    'doubleOutlineButton',
                    'transparentOutlineButton',
                    'parallelogramButton',
                    'resizeButton',
                    'outlineShadowButton',
                    'underlineButton',
                    'borderHoverButton',
                    '3dButton',
                    'strikethroughOutlineButton',
                    'simpleGradientButton',
                    'quoteButton',
                    'strikethroughButton',
                    'filledShadowButton',
                    'animatedShadowButton',
                    'symmetricButton',
                    'zigZagButton',
                    'smoothShadowButton',
                    'halfOutlineButton',
                    'gatsbyButton',
                    'animatedIconButton',
                    'animatedTwoColorButton',
                    'separatedButton',
                    'basicShadowButton',
                    'growShadowButton',
                    '3ColorButton',
                    'doubleTextButton',
                    'callToActionButton',
                    'iconButton',
                ],
                'icon' => $urlHelper->to('public/categories/icons/Button.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Button.svg'),
            ],
            'Menus' => [
                'title' => 'Menus',
                'elements' => [
                    'basicMenu',
                    'sandwichMenu',
                    'sandwichSideMenu',
                    'sidebarMenu',
                    'verticalSandwichMenu',
                ],
                'icon' => $urlHelper->to('public/categories/icons/Header-Footer.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Header-Footer.svg'),
            ],
            'Headers & Footers' => [
                'title' => 'Headers & Footers',
                'elements' => ['logoWidget', 'copyright'],
                'icon' => $urlHelper->to('public/categories/icons/Header-Footer.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Header-Footer.svg'),
            ],
            'Link Dropdown' => [
                'title' => 'Link Dropdown',
                'elements' => ['linkDropdown'],
                'icon' => $urlHelper->to('public/categories/icons/Header-Footer.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Header-Footer.svg'),
            ],
            'Feature' => [
                'title' => 'Feature',
                'elements' => ['feature'],
                'icon' => $urlHelper->to('public/categories/icons/Feature.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Feature.svg'),
            ],
            'Feature section' => [
                'title' => 'Feature Section',
                'elements' => ['featureSection'],
                'icon' => $urlHelper->to('public/categories/icons/Feature.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Feature.svg'),
            ],
            'Section' => [
                'title' => 'Section',
                'elements' => [
                    'section',
                    'popupRoot',
                    'layoutWpContentArea',
                    'layoutWpCommentsArea',
                    'layoutHeaderArea',
                    'layoutFooterArea',
                    'layoutSidebarArea',
                ],
                'icon' => $urlHelper->to('public/categories/icons/Section.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Section.svg'),
            ],
            'Hero section' => [
                'title' => 'Hero Section',
                'elements' => ['heroSection'],
                'icon' => $urlHelper->to('public/categories/icons/Hero-Section.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Hero-Section.svg'),
            ],
            'Icon' => [
                'title' => 'Icon',
                'elements' => ['icon'],
                'icon' => $urlHelper->to('public/categories/icons/Icon.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Icon.svg'),
            ],
            'Icon Group' => [
                'title' => 'Icon Group',
                'elements' => ['iconGroup'],
                'icon' => $urlHelper->to('public/categories/icons/Icon.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Icon.svg'),
            ],
            'Logo Slider' => [
                'title' => 'Logo Slider',
                'elements' => ['logoSlider'],
                'icon' => $urlHelper->to('public/categories/icons/Image-Slider.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Image-Slider.svg'),
            ],
            'Timeline Slideshow' => [
                'title' => 'Timeline Slideshow',
                'elements' => ['timelineSlideshow'],
                'icon' => $urlHelper->to('public/categories/icons/Image-Slider.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Image-Slider.svg'),
            ],
            'Simple Image Slider' => [
                'title' => 'Simple Image Slider',
                'elements' => ['simpleImageSlider'],
                'icon' => $urlHelper->to('public/categories/icons/Image-Slider.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Image-Slider.svg'),
            ],
            'Single image' => [
                'title' => 'Single Image',
                'elements' => ['singleImage'],
                'icon' => $urlHelper->to('public/categories/icons/Single-Image.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Single-Image.svg'),
            ],
            'Images' => [
                'title' => 'Images',
                'elements' => ['hoverImage', 'phoneMockup', 'browserMockup', 'parallaxSingleImage', 'gifAnimation'],
                'icon' => $urlHelper->to('public/categories/icons/Single-Image.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Single-Image.svg'),
            ],
            'Giphy' => [
                'title' => 'Giphy',
                'elements' => ['giphy'],
                'icon' => $urlHelper->to('public/categories/icons/Single-Image.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Single-Image.svg'),
            ],
            'Image gallery' => [
                'title' => 'Image Gallery',
                'elements' => ['imageGallery'],
                'icon' => $urlHelper->to('public/categories/icons/Image-Gallery.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Image-Gallery.svg'),
            ],
            'Image Masonry Gallery' => [
                'title' => 'Image Masonry Gallery',
                'elements' => ['imageMasonryGallery'],
                'icon' => $urlHelper->to('public/categories/icons/Image-Gallery.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Image-Gallery.svg'),
            ],
            'Multiple Image Collage' => [
                'title' => 'Multiple Image Collage',
                'elements' => ['multipleImageCollage'],
                'icon' => $urlHelper->to('public/categories/icons/Image-Gallery.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Image-Gallery.svg'),
            ],
            'Image Galleries' => [
                'title' => 'Image Galleries',
                'elements' => [
                    'imageMasonryGalleryWithIcon',
                    'imageMasonryGalleryWithScaleUp',
                    'imageMasonryGalleryWithZoom',
                    'imageGalleryWithIcon',
                    'imageGalleryWithScaleUp',
                    'imageGalleryWithZoom',
                ],
                'icon' => $urlHelper->to('public/categories/icons/Image-Gallery.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Image-Gallery.svg'),
            ],
            'Text block' => [
                'title' => 'Text Block',
                'elements' => ['textBlock', 'googleFontsHeading'],
                'icon' => $urlHelper->to('public/categories/icons/Text-Block.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Text-Block.svg'),
            ],
            'Heading Elements' => [
                'title' => 'Heading Elements',
                'elements' => ['typewriterHeading', 'marqueeElement', 'doubleTitle'],
                'icon' => $urlHelper->to('public/categories/icons/Text-Block.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Text-Block.svg'),
            ],
            'Misc' => [
                'title' => 'Misc',
                'elements' => [
                    'demoElement',
                    'foodAndDrinksMenu',
                    'syntaxHighlighter',
                    'timelineWithIcons',
                    'profileWithIcon',
                    'starRanking',
                ],
                'icon' => $urlHelper->to('public/categories/icons/Misc.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Misc.svg'),
            ],
            'Misc Basic' => [
                'title' => 'Misc Basic',
                'elements' => ['rawHtml', 'rawJs', 'globalTemplate', 'simpleContactForm'],
                'icon' => $urlHelper->to('public/categories/icons/Misc.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Misc.svg'),
            ],
            'Soundcloud Player' => [
                'title' => 'Soundcloud Player',
                'elements' => ['soundcloudPlayer'],
                'icon' => $urlHelper->to('public/categories/icons/Misc.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Misc.svg'),
            ],
            'Banner Element' => [
                'title' => 'Banner Element',
                'elements' => ['bannerElement'],
                'icon' => $urlHelper->to('public/categories/icons/Misc.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Misc.svg'),
            ],
            'Pricing table' => [
                'title' => 'Pricing Table',
                'elements' => [
                    'pricingTable',
                    'outlinePricingTable',
                    'shadowPricingTable',
                ],
                'icon' => $urlHelper->to('public/categories/icons/Pricing-Table.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Pricing-Table.svg'),
            ],
            'Social' => [
                'title' => 'Social',
                'elements' => [
                    'facebookLike',
                    'facebookShare',
                    'facebookSave',
                    'facebookComments',
                    'facebookQuote',
                    'facebookPage',
                    'facebookEmbeddedVideo',
                    'facebookEmbeddedComments',
                    'facebookEmbeddedPosts',
                    'flickrImage',
                    'flickrWidget',
                    'monoSocialIcons',
                    'pinterestPinit',
                    'twitterGrid',
                    'twitterTweet',
                    'twitterTimeline',
                    'twitterButton',
                ],
                'icon' => $urlHelper->to('public/categories/icons/Social.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Social.svg'),
            ],
            'Instagram Image' => [
                'title' => 'Instagram Image',
                'elements' => ['instagramImage'],
                'icon' => $urlHelper->to('public/categories/icons/Social.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Social.svg'),
            ],
            'Social Profile Icons' => [
                'title' => 'Social Profile Icons',
                'elements' => ['socialProfileIcons'],
                'icon' => $urlHelper->to('public/categories/icons/Social.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Social.svg'),
            ],
            'Videos' => [
                'title' => 'Videos',
                'elements' => [
                    'videoPlayer',
                    'videoPopup',
                ],
                'icon' => $urlHelper->to('public/categories/icons/Video.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Video.svg'),
            ],
            'Social Videos' => [
                'title' => 'Social Videos',
                'elements' => ['youtubePlayer', 'vimeoPlayer'],
                'icon' => $urlHelper->to('public/categories/icons/Video.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Video.svg'),
            ],
            'WooCommerce' => [
                'title' => 'WooCommerce',
                'elements' => [
                    'woocommerceTopRatedProducts',
                    'woocommerceSaleProducts',
                    'woocommerceRelatedProducts',
                    'woocommerceRecentProducts',
                    'woocommerceProducts',
                    'woocommerceProductPage',
                    'woocommerceProductCategory',
                    'woocommerceProductCategories',
                    'woocommerceProductAttribute',
                    'woocommerceProduct',
                    'woocommerceOrderTracking',
                    'woocommerceMyAccount',
                    'woocommerceFeaturedProducts',
                    'woocommerceCheckout',
                    'woocommerceCart',
                    'woocommerceBestSellingProducts',
                    'woocommerceAddToCart',
                    'woocommerceProducts32',
                    'cartIconWithCounter',
                ],
                'icon' => $urlHelper->to('public/categories/icons/WordPress.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/WordPress.svg'),
            ],
            'Separator' => [
                'title' => 'Separator',
                'elements' => ['separator'],
                'icon' => $urlHelper->to('public/categories/icons/Separator.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Separator.svg'),
            ],
            'Separators' => [
                'title' => 'Separators',
                'elements' => [
                    'doubleSeparator',
                    'separatorIcon',
                    'separatorTitle',
                    'zigZagSeparator',
                ],
                'icon' => $urlHelper->to('public/categories/icons/Separator.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Separator.svg'),
            ],
            'Maps' => [
                'title' => 'Maps',
                'elements' => ['googleMaps'],
                'icon' => $urlHelper->to('public/categories/icons/Map.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Map.svg'),
            ],
            'Grids' => [
                'title' => 'Grids',
                'elements' => [
                    'postsGrid',
                    'featuredImagePostGrid',
                    'centeredPostGrid',
                    'postsSlider',
                    'slideOutPostGrid',
                    'sidePostGrid',
                    'newsPostGrid',
                    'backgroundImagePostGrid',
                    'postGridWithBox',
                    'postSliderBlock',
                    'portfolioPostGrid',
                    'postGridWithHoverButton',
                ],
                'icon' => $urlHelper->to('public/categories/icons/Post-Grid.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Post-Grid.svg'),
            ],
            '_postsGridSources' => [
                'title' => 'Post Grid Data Sources',
                'elements' => [
                    'postsGridDataSourceArchive',
                    'postsGridDataSourcePost',
                    'postsGridDataSourcePage',
                    'postsGridDataSourceCustomPostType',
                    'postsGridDataSourceListOfIds',
                ],
                'icon' => $urlHelper->to('public/categories/icons/Post-Grid.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Post-Grid.svg'),
            ],
            '_postsGridItems' => [
                'title' => 'Post Grid Item Post Description',
                'elements' => [
                    'postsGridItemPostDescription',
                    'featuredImagePostGridItem',
                    'centeredPostGridItem',
                    'postsSliderItem',
                    'slideOutPostGridItem',
                    'sidePostGridItem',
                    'newsPostGridItem',
                    'backgroundImagePostGridItem',
                    'portfolioPostGridItem',
                    'postGridWithBoxItem',
                    'postSliderBlockItem',
                    'postGridWithHoverButtonItem',
                ],
                'icon' => $urlHelper->to('public/categories/icons/Post-Grid.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Post-Grid.svg'),
            ],
            'FAQ Toggle' => [
                'title' => 'Toggle',
                'elements' => ['faqToggle'],
                'icon' => $urlHelper->to('public/categories/icons/Toggle.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Toggle.svg'),
            ],
            'Outline FAQ Toggle' => [
                'title' => 'Toggle',
                'elements' => ['outlineFaqToggle'],
                'icon' => $urlHelper->to('public/categories/icons/Toggle.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Toggle.svg'),
            ],
            'Message Box Basic' => [
                'title' => 'Message Box Basic',
                'elements' => ['messageBox'],
                'icon' => $urlHelper->to('public/categories/icons/Message-Box.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Message-Box.svg'),
            ],
            'Message Box' => [
                'title' => 'Message Box',
                'elements' => ['outlineMessageBox', 'simpleMessageBox', 'semiFilledMessageBox'],
                'icon' => $urlHelper->to('public/categories/icons/Message-Box.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Message-Box.svg'),
            ],
            'Hover Box' => [
                'title' => 'Hover Box',
                'elements' => ['hoverBox'],
                'icon' => $urlHelper->to('public/categories/icons/Hover-Box.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Hover-Box.svg'),
            ],
            'Icon Hover Box' => [
                'title' => 'Icon Hover Box',
                'elements' => ['iconHoverBox'],
                'icon' => $urlHelper->to('public/categories/icons/Hover-Box.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Hover-Box.svg'),
            ],
            'Tall Hover Box' => [
                'title' => 'Tall Hover Box',
                'elements' => ['tallHoverBox'],
                'icon' => $urlHelper->to('public/categories/icons/Hover-Box.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Hover-Box.svg'),
            ],
            'Flip Box' => [
                'title' => 'Flip Box',
                'elements' => ['flipBox'],
                'icon' => $urlHelper->to('public/categories/icons/Hover-Box.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Hover-Box.svg'),
            ],
            'WordPress' => [
                'title' => 'WordPress',
                'elements' => [
                    'advancedCustomFields',
                    'calderaForms',
                    'captainForm',
                    'contactForm7',
                    'enviraGallery',
                    'essentialGrid',
                    'eventOnCalendar',
                    'gravityForms',
                    'gutenberg',
                    'mailChimpForWordPress',
                    'layerSlider',
                    'nextGenGallery',
                    'wpDataTables',
                    'ninjaForms',
                    'sliderRevolution',
                    'translatePressLanguageSwitcher',
                    'wpForms',
                ],
                'icon' => $urlHelper->to('public/categories/icons/WordPress.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/WordPress.svg'),
            ],
            'WordPress Basic' => [
                'title' => 'WordPress Basic',
                'elements' => ['shortcode', 'wpWidgetsCustom', 'wpWidgetsDefault'],
                'icon' => $urlHelper->to('public/categories/icons/WordPress.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/WordPress.svg'),
            ],
            'Widgetized Sidebar' => [
                'title' => 'Widgetized Sidebar',
                'elements' => ['widgetizedSidebar'],
                'icon' => $urlHelper->to('public/categories/icons/WordPress.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/WordPress.svg'),
            ],
            'Simple Search' => [
                'title' => 'Simple Search',
                'elements' => ['simpleSearch'],
                'icon' => $urlHelper->to('public/categories/icons/WordPress.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/WordPress.svg'),
            ],
            'Add To Any Share Buttons' => [
                'title' => 'Add To Any Share Buttons',
                'elements' => ['addToAnyShareButtons'],
                'icon' => $urlHelper->to('public/categories/icons/WordPress.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/WordPress.svg'),
            ],
            'Feature Description' => [
                'title' => 'Feature Description',
                'elements' => ['featureDescription'],
                'icon' => $urlHelper->to('public/categories/icons/Feature.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Feature.svg'),
            ],
            'Basic Call To Action' => [
                'title' => 'Basic Call To Action',
                'elements' => ['callToAction'],
                'icon' => $urlHelper->to('public/categories/icons/Call-To-Action.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Call-To-Action.svg'),
            ],
            'Call To Action' => [
                'title' => 'Call To Action',
                'elements' => ['simpleCallToAction', 'outlineCallToAction', 'callToActionWithIcon'],
                'icon' => $urlHelper->to('public/categories/icons/Call-To-Action.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Call-To-Action.svg'),
            ],
            'Empty Space' => [
                'title' => 'Empty Space',
                'elements' => ['emptySpace'],
                'icon' => $urlHelper->to('public/categories/icons/Misc.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Misc.svg'),
            ],
            'Testimonial' => [
                'title' => 'Testimonial',
                'elements' => [
                    'testimonial',
                    'basicTestimonial',
                    'starTestimonials',
                ],
                'icon' => $urlHelper->to('public/categories/icons/Testimonial.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Testimonial.svg'),
            ],
            'Accordions' => [
                'title' => 'Accordions',
                'elements' => ['classicAccordion'],
                'icon' => $urlHelper->to('public/categories/icons/Container.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Container.svg'),
            ],
            'Accordion Section' => [
                'title' => 'Accordion Section',
                'elements' => ['classicAccordionSection'],
                'icon' => $urlHelper->to('public/categories/icons/Container.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Container.svg'),
            ],
            'Charts' => [
                'title' => 'Charts',
                'elements' => ['progressBars'],
                'icon' => $urlHelper->to('public/categories/icons/Chart.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Chart.svg'),
            ],
            'Counter' => [
                'title' => 'Counter',
                'elements' => ['counterUp', 'countdownTimer'],
                'icon' => $urlHelper->to('public/categories/icons/Counter.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Counter.svg'),
            ],
            // BC Categories for 3rd party
            'Button' => [
                'title' => 'Simple Button',
                'elements' => [],
                'icon' => $urlHelper->to('public/categories/icons/Button.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Button.svg'),
            ],
            'Header & Footer' => [
                'title' => 'Header & Footer',
                'elements' => [],
                'icon' => $urlHelper->to('public/categories/icons/Header-Footer.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Header-Footer.svg'),
            ],
            'Image Slider' => [
                'title' => 'Image Slider',
                'elements' => [],
                'icon' => $urlHelper->to('public/categories/icons/Image-Slider.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Image-Slider.svg'),
            ],
            'Toggle' => [
                'title' => 'Toggle',
                'elements' => [],
                'icon' => $urlHelper->to('public/categories/icons/Toggle.svg'),
                'iconDark' => $urlHelper->to('public/categories/iconsDark/Toggle.svg'),
            ],
        ];

        $categoriesDiffer->set($defaultCategories);
        $storedInDbCategories = $optionHelper->get('hubCategories', []);
        // BC for stored categories and fix in case if element was moved to other category
        $updateStoredCategories = $this->updateStoredCategories($defaultCategories, $storedInDbCategories);
        if ($updateStoredCategories['changesInStoredDb']) {
            $storedInDbCategories = $updateStoredCategories['storedInDbCategories'];
            // Update database for performance in next reload
            $this->setCategories($storedInDbCategories);
        }

        $categoriesDiffer->onUpdate(
            [
                $hubCategoriesHelper,
                'updateCategory',
            ]
        )->set($storedInDbCategories);

        return $categoriesDiffer->get();
    }
}
