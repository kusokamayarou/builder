import React from 'react'
import classNames from 'classnames'
import ElementControl from './elementControl'
import Scrollbar from '../../../scrollbar/scrollbar.js'
import SearchElement from './searchElement'
import vcCake from 'vc-cake'
import PropTypes from 'prop-types'
import ElementsGroup from './elementsGroup'

const categoriesService = vcCake.getService('hubCategories')
const groupsService = vcCake.getService('hubGroups')
const sharedAssetsLibraryService = vcCake.getService('sharedAssetsLibrary')
const workspaceStorage = vcCake.getStorage('workspace')
const hubElementsStorage = vcCake.getStorage('hubElements')
const cook = vcCake.getService('cook')
const elementsStorage = vcCake.getStorage('elements')
const dataProcessor = vcCake.getService('dataProcessor')

export default class Categories extends React.Component {
  static propTypes = {
    parent: PropTypes.object
  }

  static localizations = window.VCV_I18N && window.VCV_I18N()

  static allElements = []
  static allCategories = []
  static allGroupData = {}
  static allElementsTags = []
  static hubElements = []
  static addedId = null
  static parentElementTag = null
  static elementPresets = []

  constructor (props) {
    super(props)

    this.state = {
      inputValue: '',
      focusedElement: null
    }

    this.changeInput = this.changeInput.bind(this)
    this.handleGoToHub = this.handleGoToHub.bind(this)
    this.applyFirstElement = this.applyFirstElement.bind(this)
    this.addElement = this.addElement.bind(this)
    this.openEditForm = this.openEditForm.bind(this)
    this.setFocusedElement = this.setFocusedElement.bind(this)
    this.reset = this.reset.bind(this)
    this.handleGroupToggle = this.handleGroupToggle.bind(this)
    Categories.hubElements = hubElementsStorage.state('elements').get()
    hubElementsStorage.once('loaded', this.reset)
    hubElementsStorage.state('elementPresets').onChange(this.reset)
  }

  componentWillUnmount () {
    this.isComponentMounted = false
  }

  componentDidMount () {
    this.isComponentMounted = true
  }

  reset () {
    Categories.allCategories = []
    Categories.allElements = []
    Categories.allElementsTags = []
    Categories.elementPresets = []
    Categories.hubElements = hubElementsStorage.state('elements').get()

    categoriesService.getSortedElements.cache.clear()
    this.isComponentMounted && this.forceUpdate()
  }

  hasItemInArray (arr, value) {
    if (Array.isArray(value)) {
      let result = false
      value.find((v) => {
        result = this.hasItemInArray(arr, v)
        return result
      })
      return result
    }
    return arr.indexOf(value) > -1
  }

  getAllElements () {
    const { parent } = this.props
    let relatedTo = ['General', 'RootElements']
    const isParentTag = parent && parent.tag && parent.tag !== 'column'
    if (isParentTag) {
      const parentElement = cook.get(parent)
      if (parentElement) {
        relatedTo = parentElement.containerFor()
      }
    }
    const isAllElements = !Categories.allElements.length || Categories.parentElementTag !== parent.tag
    const isPresetsUpdated = Categories.elementPresets.length !== hubElementsStorage.state('elementPresets').get().length
    if (isAllElements || isPresetsUpdated) {
      const allElements = categoriesService.getSortedElements()
      Categories.allElements = allElements.filter((elementData) => {
        // Do not show custom root element in add element panel
        if (Array.isArray(elementData.relatedTo) && elementData.relatedTo.indexOf('CustomRoot') > -1) {
          return false
        }
        return this.hasItemInArray(relatedTo, elementData.relatedTo)
      })

      const elementPresets = hubElementsStorage.state('elementPresets').get().map((elementPreset) => {
        const cookElement = cook.get(elementPreset.presetData)
        const element = cookElement.toJS()
        element.usageCount = elementPreset.usageCount
        element.name = elementPreset.name
        element.presetId = elementPreset.id
        element.metaDescription = cookElement.get('metaDescription')
        element.metaThumbnailUrl = cookElement.get('metaThumbnailUrl')
        element.metaPreviewUrl = cookElement.get('metaPreviewUrl')
        delete element.id
        return element
      })
      Categories.allElements = elementPresets.concat(Categories.allElements)
    }
    return Categories.allElements
  }

  getAllElementsTags () {
    const isElementTags = !Categories.allElementsTags.length || Categories.parentElementTag !== this.props.parent.tag
    if (isElementTags) {
      const allElements = this.getAllElements()

      Categories.allElementsTags = allElements.map((element) => {
        return element.tag
      })
    }

    return Categories.allElementsTags
  }

  getElementsList (groupCategories, tags) {
    let groupElements = []
    const setGroupElements = (element) => {
      if (tags.indexOf(element.tag) > -1) {
        groupElements.push(element)
      }
    }
    if (groupCategories === true) {
      // Get ALL
      groupElements = this.getAllElements()
    } else {
      groupCategories.forEach((category) => {
        const categoryElements = categoriesService.getSortedElements(category)
        categoryElements.forEach(setGroupElements)
      })
    }
    groupElements = [...new Set(groupElements)]

    return groupElements
  }

  getAllCategories () {
    const isCategories = !Categories.allCategories.length || Categories.parentElementTag !== this.props.parent.tag
    const isPresetsUpdated = Categories.elementPresets.length !== hubElementsStorage.state('elementPresets').get().length

    if (isCategories || isPresetsUpdated) {
      const groupsStore = {}
      const groups = groupsService.all()
      const tags = this.getAllElementsTags()
      Categories.allCategories = groups.filter((group) => {
        groupsStore[group.title] = this.getElementsList(group.categories, tags)
        return groupsStore[group.title].length > 0
      }).map((group, index) => {
        return {
          id: group.title + index, // TODO: Should it be more unique?
          index: index,
          title: group.title,
          elements: groupsStore[group.title]
        }
      })
      Categories.parentElementTag = this.props.parent.tag
      Categories.elementPresets = hubElementsStorage.state('elementPresets').get()
    }

    return Categories.allCategories
  }

  changeInput (value) {
    this.setState({
      inputValue: value,
      searchResults: this.getSearchResults(value)
    })
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

  getNoResultsElement () {
    const nothingFoundText = Categories.localizations ? Categories.localizations.nothingFound : 'Nothing found'
    const helperText = Categories.localizations ? Categories.localizations.goToHubButtonDescription : 'Access Visual Composer Hub - download additional elements, templates and extensions.'
    const source = sharedAssetsLibraryService.getSourcePath('images/search-no-result.png')

    return (
      <div className='vcv-ui-editor-no-items-container'>
        <div className='vcv-ui-editor-no-items-content'>
          <img
            className='vcv-ui-editor-no-items-image'
            src={source}
            alt={nothingFoundText}
          />
        </div>
        <div>
          <div className='vcv-ui-editor-no-items-content'>
            {this.getMoreButton()}
          </div>
          <div className='vcv-ui-editor-no-items-content'>
            <p className='vcv-start-blank-helper'>{helperText}</p>
          </div>
        </div>
      </div>
    )
  }

  getElementControl (elementData) {
    const { tag, name } = elementData
    const key = `vcv-element-control-${name.replace(/ /g, '')}-${tag}`

    return (
      <ElementControl
        key={key}
        elementPresetId={elementData.presetId}
        element={elementData}
        hubElement={Categories.hubElements[tag]}
        tag={tag}
        name={name}
        addElement={this.addElement}
        setFocusedElement={this.setFocusedElement}
        applyFirstElement={this.applyFirstElement}
      />
    )
  }

  changeSearchState (state) {
    this.setState({
      isSearching: state
    })
  }

  getSearchElement () {
    const searchProps = {
      changeInput: this.changeInput,
      applyFirstElement: this.applyFirstElement
    }
    return <SearchElement {...searchProps} />
  }

  getAllGroupData () {
    const isAllGroupDataSet = Categories.allGroupData && Categories.allGroupData.elements

    if (!isAllGroupDataSet) {
      const tags = this.getAllElementsTags()

      Categories.allGroupData = {
        title: 'All',
        elements: this.getElementsList(true, tags)
      }
    }

    return Categories.allGroupData
  }

  getFoundElements () {
    return this.state.searchResults.map((elementData) => {
      return this.getElementControl(elementData)
    })
  }

  getSearchResults (value) {
    const allGroupData = this.getAllGroupData()

    function getElementName (elementData) {
      let elName = ''
      if (elementData.name) {
        elName = elementData.name.toLowerCase()
      } else if (elementData.tag) {
        const element = cook.get(elementData)
        if (element.get('name')) {
          elName = element.get('name').toLowerCase()
        }
      }

      return elName
    }

    return allGroupData.elements.filter((elementData) => {
      const elName = getElementName(elementData)
      return elName.indexOf(value.trim()) !== -1
    }).sort((a, b) => getElementName(a).indexOf(value.trim()) - getElementName(b).indexOf(value.trim()))
  }

  getElementsByCategory () {
    const allCategories = this.getAllCategories()
    const presets = allCategories.find(element => element.id === 'Presets')
    const favorites = allCategories.find(element => element.id === 'Favorites')

    if (!presets) {
      const presetElements = Categories.allElements.filter(element => element.presetId)
      if (presetElements.length > 0) {
        const presetElementsCategory = {
          id: 'Presets',
          title: 'Presets',
          elements: presetElements
        }
        allCategories.unshift(presetElementsCategory)
      }
    }

    if (!favorites) {
      const favoriteElements = Categories.allElements.filter(element => element.usageCount > 9).sort((elementA, elementB) => elementB.usageCount - elementA.usageCount).slice(0, 9)
      if (favoriteElements.length > 0) {
        const favoriteElementsCategory = {
          id: 'Favorites',
          title: 'Favorites',
          elements: favoriteElements
        }
        allCategories.unshift(favoriteElementsCategory)
      }
    }

    const allElements = []

    allCategories.forEach((groupData) => {
      const groupElements = []
      groupData.elements.forEach((element) => {
        groupElements.push(this.getElementControl(element))
      })
      groupElements.sort((a, b) => {
        const x = a.props.name
        const y = b.props.name
        return ((x < y) ? -1 : ((x > y) ? 1 : 0))
      })
      allElements.push(
        <ElementsGroup
          key={`vcv-element-category-${groupData.id}`}
          groupData={groupData}
          isOpened={Object.prototype.hasOwnProperty.call(groupData, 'isOpened') ? groupData.isOpened : true}
          onGroupToggle={this.handleGroupToggle}
        >
          {groupElements}
        </ElementsGroup>
      )
    })

    return allElements
  }

  handleGroupToggle (groupID, isOpened) {
    const groupIndex = Categories.allCategories.findIndex(group => group.id === groupID)
    if (groupIndex > -1 && Categories.allCategories[groupIndex]) {
      Categories.allCategories[groupIndex].isOpened = isOpened
    }
  }

  getElementListContainer (itemsOutput) {
    if (itemsOutput.length) {
      return (
        <div className='vcv-ui-item-list-container'>
          <div className='vcv-ui-item-list'>
            {itemsOutput}
          </div>
        </div>
      )
    } else {
      return this.getNoResultsElement()
    }
  }

  applyFirstElement () {
    const { searchResults, focusedElement } = this.state
    if ((searchResults && searchResults.length) || focusedElement) {
      const element = focusedElement || searchResults[0]
      this.addElement(element)
    }
  }

  addElement (element, presetId = false) {
    const workspace = workspaceStorage.state('settings').get() || false
    element.parent = workspace && workspace.element ? workspace.element.id : false
    element = cook.get(element).toJS()

    elementsStorage.trigger('add', element, true, {
      insertAfter: workspace && workspace.options && workspace.options.insertAfter ? workspace.options.insertAfter : false
    })
    this.addedId = element.id
    const itemTag = presetId ? Categories.elementPresets.find(element => element.id === presetId).tag : element.tag
    dataProcessor.appAdminServerRequest({
      'vcv-action': 'favoriteItems:updateUsage:adminNonce',
      'vcv-item-tag': itemTag,
      'vcv-nonce': window.vcvNonce
    })

    const iframe = document.getElementById('vcv-editor-iframe')
    this.iframeWindow = iframe && iframe.contentWindow && iframe.contentWindow.window
    this.iframeWindow.vcv && this.iframeWindow.vcv.on('ready', this.openEditForm)
  }

  openEditForm (action, id) {
    if (action === 'add' && id === this.addedId) {
      workspaceStorage.trigger('edit', this.addedId, '')
      this.iframeWindow.vcv.off('ready', this.openEditForm)
    }
  }

  getMoreButton () {
    const buttonText = Categories.localizations ? Categories.localizations.getMoreElements : 'Get More Elements'
    return (
      <button className='vcv-start-blank-button' onClick={this.handleGoToHub}>
        {buttonText}
      </button>
    )
  }

  setFocusedElement (element) {
    this.setState({ focusedElement: element })
  }

  render () {
    const hubButtonDescriptionText = Categories.localizations ? Categories.localizations.goToHubButtonDescription : 'Access Visual Composer Hub - download additional elements, templates and extensions.'
    const itemsOutput = this.state.inputValue ? this.getFoundElements() : this.getElementsByCategory()
    const innerSectionClasses = classNames({
      'vcv-ui-tree-content-section-inner': true,
      'vcv-ui-state--centered-content': !itemsOutput.length
    })
    let moreButton = null
    if (itemsOutput.length) {
      moreButton = (
        <div className='vcv-ui-editor-get-more'>
          {this.getMoreButton()}
          <span className='vcv-ui-editor-get-more-description'>{hubButtonDescriptionText}</span>
        </div>
      )
    }

    return (
      <div className='vcv-ui-tree-content'>
        {this.getSearchElement()}
        <div className='vcv-ui-tree-content-section'>
          <Scrollbar>
            <div className={innerSectionClasses}>
              <div className='vcv-ui-editor-plates-container'>
                <div className='vcv-ui-editor-plates'>
                  <div className='vcv-ui-editor-plate vcv-ui-state--active'>
                    {this.getElementListContainer(itemsOutput)}
                  </div>
                </div>
              </div>
              {moreButton}
            </div>
          </Scrollbar>
        </div>
      </div>
    )
  }
}
