/* eslint react/jsx-no-bind:"off" */
import React from 'react'
import classNames from 'classnames'
import vcCake from 'vc-cake'
import PropTypes from 'prop-types'

const Cook = vcCake.getService('cook')
const hubCategoriesService = vcCake.getService('hubCategories')
const hubElementsStorage = vcCake.getStorage('hubElements')
const workspaceStorage = vcCake.getStorage('workspace')

export default class ReplaceElement extends React.Component {
  static propTypes = {
    onReplace: PropTypes.func.isRequired,
    tag: PropTypes.string.isRequired,
    element: PropTypes.object.isRequired,
    options: PropTypes.any
  }

  constructor (props) {
    super(props)
    this.handleReplace = this.handleReplace.bind(this)
    this.handleGoToHub = this.handleGoToHub.bind(this)
  }

  handleReplace (newElementTag, cookElement) {
    this.props.onReplace(newElementTag, cookElement)
  }

  handleGoToHub () {
    const settings = {
      action: 'addHub',
      element: {},
      tag: '',
      options: {
        filterType: 'element',
        id: '1-0',
        bundleType: undefined
      }
    }
    workspaceStorage.state('settings').set(settings)
  }

  getReplacementItem (elementData, name) {
    const cookElement = Cook.get(elementData)

    if (!cookElement || !cookElement.get('name') || cookElement.get('name') === '--') {
      return null
    }

    const { tag } = elementData
    const elementName = name || cookElement.get('name')
    const publicPathThumbnail = cookElement.get('metaThumbnailUrl')

    const nameClasses = classNames({
      'vcv-ui-item-badge vcv-ui-badge--success': false,
      'vcv-ui-item-badge vcv-ui-badge--warning': false
    })
    const itemContentClasses = classNames({
      'vcv-ui-item-element-content': true,
      'vcv-ui-item-list-item-content--active': !name && this.props.tag === tag
    })
    const itemClasses = classNames({
      'vcv-ui-item-list-item': true,
      'vcv-ui-item-list-item--preset': !!name
    })
    return (
      <li
        key={`vcv-replace-element-${elementName.replace(/ /g, '')}-${tag}`}
        className={itemClasses}
      >
        <span
          className='vcv-ui-item-element'
          onClick={this.handleReplace.bind(this, tag, name ? cookElement : null)}
        >
          <span className={itemContentClasses}>
            <img
              className='vcv-ui-item-element-image' src={publicPathThumbnail}
              alt={elementName}
            />
            <span className='vcv-ui-item-overlay'>
              <span className='vcv-ui-item-add vcv-ui-icon vcv-ui-icon-add' />
            </span>
          </span>
          <span className='vcv-ui-item-element-name'>
            <span className={nameClasses}>
              {elementName}
            </span>
          </span>
        </span>
      </li>
    )
  }

  getReplacements (categorySettings) {
    return categorySettings.elements.map((tag) => {
      return this.getReplacementItem({ tag: tag })
    })
  }

  getPresetReplacements (presets) {
    return presets.map((preset) => {
      return this.getReplacementItem(preset.presetData, preset.name)
    })
  }

  render () {
    const { options } = this.props
    const { category } = options
    const categorySettings = hubCategoriesService.get(category)
    const presetsByCategory = hubElementsStorage.action('getPresetsByCategory', category)
    const localizations = window.VCV_I18N && window.VCV_I18N()
    const replaceElementText = localizations ? localizations.replaceElementEditForm : 'Replace current element with different element from the same category'
    const substituteElementText = localizations ? localizations.substituteElement : 'Substitute Element'
    const getMoreButtonText = localizations ? localizations.getMoreElements : 'Get More Elements'
    const hubButtonDescriptionText = localizations ? localizations.goToHubButtonDescription : 'Access Visual Composer Hub - download additional elements, templates and extensions.'
    const replacementPresetItems = this.getPresetReplacements(presetsByCategory)
    const replacementItemsOutput = this.getReplacements(categorySettings)
    const replacements = (
      <div className='vcv-ui-replace-element-container'>
        <h2 className='vcv-ui-replace-element-heading'>{substituteElementText}</h2>
        <p className='vcv-ui-replace-element-description'>
          {replaceElementText}
        </p>
        <ul className='vcv-ui-replace-element-list'>
          {replacementPresetItems}
          {replacementItemsOutput}
        </ul>
      </div>
    )

    const moreButton = (
      <div className='vcv-ui-editor-get-more'>
        <button className='vcv-start-blank-button' onClick={this.handleGoToHub}>
          {getMoreButtonText}
        </button>
        <span className='vcv-ui-editor-get-more-description'>{hubButtonDescriptionText}</span>
      </div>
    )

    return (
      <div className='vcv-ui-form-element'>
        <div className='vcv-ui-replace-element-block'>
          {replacements}
          {moreButton}
        </div>
      </div>
    )
  }
}
