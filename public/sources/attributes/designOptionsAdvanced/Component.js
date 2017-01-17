import React from 'react'
import lodash from 'lodash'
import Attribute from '../attribute'
import Devices from '../devices/Component'
import Toggle from '../toggle/Component'
import Dropdown from '../dropdown/Component'
import BoxModel from '../boxModel/Component'
import AttachImage from '../attachimage/Component'

class DesignOptionsAdvanced extends Attribute {
  /**
   * Attribute Mixins
   */
  static attributeMixins = {
    testMixin: {
      src: require('raw-loader!./cssMixins/designeOptionsAdvanced.pcss'),
      variables: {
        color: {
          namePattern: '[\\da-f]+',
          value: ''
        },
        background: {
          namePattern: '[\\da-f]+',
          value: ''
        },
        device: {
          value: 'md-only'
        }
      }
    },
    boxModelMixin: {
      src: require('raw-loader!./cssMixins/boxModel.pcss'),
      variables: {
        device: {
          value: false
        },
        margin: {
          value: false
        },
        padding: {
          value: false
        },
        borderWidth: {
          value: false
        },
        borderRadius: {
          value: false
        },
        borderBottomLeftRadius: {
          value: false
        },
        borderBottomRightRadius: {
          value: false
        },
        borderBottomWidth: {
          value: false
        },
        borderLeftWidth: {
          value: false
        },
        borderRightWidth: {
          value: false
        },
        borderTopLeftRadius: {
          value: false
        },
        borderTopRightRadius: {
          value: false
        },
        borderTopWidth: {
          value: false
        },
        marginBottom: {
          value: false
        },
        marginLeft: {
          value: false
        },
        marginRight: {
          value: false
        },
        marginTop: {
          value: false
        },
        paddingBottom: {
          value: false
        },
        paddingLeft: {
          value: false
        },
        paddingRight: {
          value: false
        },
        paddingTop: {
          value: false
        }
      }
    },
    visibilityMixin: {
      src: require('raw-loader!./cssMixins/visibility.pcss'),
      variables: {
        device: {
          value: `all`
        }
      }
    }
  }

  /**
   * Default state values
   */
  static defaultState = {
    currentDevice: 'all',
    backgroundType: 'imagesSimple',
    devices: {},
    attributeMixins: {}
  }

  constructor (props) {
    super(props)

    this.devicesChangeHandler = this.devicesChangeHandler.bind(this)
    this.deviceVisibilityChangeHandler = this.deviceVisibilityChangeHandler.bind(this)
    this.backgroundTypeChangeHandler = this.backgroundTypeChangeHandler.bind(this)
    this.boxModelChangeHandler = this.boxModelChangeHandler.bind(this)
    this.attachImageChangeHandler = this.attachImageChangeHandler.bind(this)
    this.backgroundStyleChangeHandler = this.backgroundStyleChangeHandler.bind(this)
  }

  /**
   * Prepare data for setState
   * @param props
   * @returns {{value: *}}
   */
  updateState (props) {
    let newState = {}
    // data came from props if there is set value
    if (props.value) {
      newState = this.parseValue(props.value)
    } else {
      // data came from state update
      newState = lodash.defaultsDeep({}, props, DesignOptionsAdvanced.defaultState)
    }
    return newState
  }

  /**
   * Parse value data and set states based on it
   * @param value
   * @returns {*}
   */
  parseValue (value) {
    // set default values
    let newState = lodash.defaultsDeep({}, DesignOptionsAdvanced.defaultState)
    // get devices data
    let devices = this.getCustomDevicesKeys()
    // set current device
    if (!lodash.isEmpty(value.device)) {
      newState.currentDevice = Object.keys(value.device).shift()
    }
    // update devices values
    devices.push('all')
    devices.forEach((device) => {
      newState.devices[ device ] = {}
      if (value.device && value.device[ device ]) {
        newState.devices[ device ] = lodash.defaultsDeep({}, value.device[ device ])
      }
    })

    return newState
  }

  /**
   * Update value
   * @param newState
   */
  updateValue (newState) {
    let newValue = {}
    let newMixins = {}

    // prepare data for state
    newState = this.updateState(newState)
    // save only needed data
    let checkDevices = []
    if (newState.currentDevice === 'all') {
      checkDevices.push('all')
    } else {
      checkDevices = checkDevices.concat(this.getCustomDevicesKeys())
    }
    checkDevices.forEach((device) => {
      if (!lodash.isEmpty(newState.devices[ device ])) {
        // values
        newValue[ device ] = lodash.defaultsDeep({}, newState.devices[ device ])
        // remove all values if display is provided
        if (newValue[ device ].hasOwnProperty('display')) {
          Object.keys(newValue[ device ]).forEach((style) => {
            if (style !== 'display') {
              delete newValue[ device ][ style ]
            }
          })
        } else {
          // Image type backgrounds
          let imgTypeBackgrounds = [
            'imagesSimple',
            'imagesSlideshow'
          ]
          if (imgTypeBackgrounds.indexOf(newState.devices[ device ].backgroundType) === -1) {
            // not image type background selected
            delete newValue[ device ].images
            delete newValue[ device ].backgroundStyle
          } else if (!newValue[ device ].hasOwnProperty('images') || newValue[ device ].images.urls.length === 0) {
            // images are empty
            delete newValue[ device ].images
            delete newValue[ device ].backgroundType
            delete newValue[ device ].backgroundStyle
          }
          // background style is empty
          if (newValue[ device ].backgroundStyle === '') {
            delete newValue[ device ].backgroundStyle
          }
        }
        // mixins
        if (newValue[ device ].hasOwnProperty('display')) {
          newMixins[ `visibilityMixin:${device}` ] = lodash.defaultsDeep({}, DesignOptionsAdvanced.attributeMixins.visibilityMixin)
          newMixins[ `visibilityMixin:${device}` ].variables = {
            device: {
              value: device
            }
          }
        } else {
          // boxModelMixin
          if (newValue[ device ].hasOwnProperty('boxModel')) {
            let value = newValue[ device ].boxModel
            if (!lodash.isEmpty(value)) {
              // update mixin
              let mixinName = `boxModelMixin:${device}`
              newMixins[ mixinName ] = {}
              newMixins[ mixinName ] = lodash.defaultsDeep({}, DesignOptionsAdvanced.attributeMixins.boxModelMixin)
              for (let property in value) {
                newMixins[ mixinName ].variables[ property ] = {
                  value: value[ property ]
                }
              }
              newMixins[ mixinName ].variables.device = {
                value: device
              }
            }
          }
        }

        // remove device from list if it's empty
        if (!Object.keys(newValue[ device ]).length) {
          delete newValue[ device ]
        }
      }
    })

    this.setFieldValue(newValue, newMixins)
    this.setState(newState)
  }

  /**
   * Flush field value to updater
   * @param value
   */
  setFieldValue (value, mixins) {
    console.log('===================')
    console.log(value)
    console.log(mixins)
    console.log('===================')
    let { updater, fieldKey } = this.props
    updater(fieldKey, {
      device: value,
      attributeMixins: mixins
    })
  }

  /**
   * Get custom devices
   * @returns Array
   */
  getCustomDevices () {
    return [
      {
        label: 'Desktop',
        value: 'xl',
        icon: 'vcv-ui-icon-desktop'
      },
      {
        label: 'Tablet Landscape',
        value: 'lg',
        icon: 'vcv-ui-icon-tablet-landscape'
      },
      {
        label: 'Tablet Portrait',
        value: 'md',
        icon: 'vcv-ui-icon-tablet-portrait'
      },
      {
        label: 'Mobile Landscape',
        value: 'sm',
        icon: 'vcv-ui-icon-mobile-landscape'
      },
      {
        label: 'Mobile Portrait',
        value: 'xs',
        icon: 'vcv-ui-icon-mobile-portrait'
      }
    ]
  }

  /**
   * Get custom devices keys
   * @returns {Array}
   */
  getCustomDevicesKeys () {
    return this.getCustomDevices().map((device) => {
      return device.value
    })
  }

  /**
   * Render device selector
   * @returns {XML}
   */
  getDevicesRender () {
    return <Devices
      api={this.props.api}
      fieldKey='currentDevice'
      options={{
        customDevices: this.getCustomDevices()
      }}
      updater={this.devicesChangeHandler}
      value={this.state.currentDevice} />
  }

  /**
   * Handle devices change
   * @returns {XML}
   */
  devicesChangeHandler (fieldKey, value) {
    let newState = lodash.defaultsDeep({}, { [fieldKey]: value }, this.state)

    if (newState.currentDevice === 'all') {
      // clone data from xl in to all except display property
      newState.devices.all = lodash.defaultsDeep({}, newState.devices[ this.getCustomDevicesKeys().shift() ])
      delete newState.devices.all.display
    } else if (this.state.currentDevice === 'all') {
      // clone data to custom devices from all
      this.getCustomDevicesKeys().forEach((device) => {
        newState.devices[ device ] = lodash.defaultsDeep({}, newState.devices.all)
      })
    }

    this.updateValue(newState)
  }

  /**
   * Render device visibility toggle
   * @returns {XML}
   */
  getDeviceVisibilityRender () {
    if (this.state.currentDevice === 'all') {
      return null
    }

    return (
      <div className='vcv-ui-form-group vcv-ui-form-group-style--inline'>
        <Toggle
          api={this.props.api}
          fieldKey={`currentDeviceVisible`}
          updater={this.deviceVisibilityChangeHandler}
          options={{ labelText: `Show on device` }}
          value={!this.state.devices[ this.state.currentDevice ].display}
        />
      </div>
    )
  }

  /**
   * Handle show on device toggle change
   * @returns {XML}
   */
  deviceVisibilityChangeHandler (fieldKey, isVisible) {
    let newState = lodash.defaultsDeep({}, this.state)
    if (isVisible) {
      delete newState.devices[ this.state.currentDevice ].display
    } else {
      // set display to none
      newState.devices[ this.state.currentDevice ].display = 'none'
    }

    this.updateValue(newState)
  }

  /**
   * Render background type dropdown
   * @returns {*}
   */
  getBackgroundTypeRender () {
    if (this.state.devices[ this.state.currentDevice ].display) {
      return null
    }
    let options = {
      values: [
        {
          label: 'Simple images',
          value: 'imagesSimple'
        },
        {
          label: 'Image slideshow',
          value: 'imagesSlideshow'
        },
        {
          label: 'Embed video',
          value: 'videoEmbed'
        },
        {
          label: 'Self-hosted video',
          value: 'videoSelfHosted'
        },
        {
          label: 'Color gradient',
          value: 'colorGradient'
        }
      ]
    }
    let value = this.state.devices[ this.state.currentDevice ].backgroundType || 'imagesSimple'
    return <div className='vcv-ui-form-group'>
      <span className='vcv-ui-form-group-heading'>
        Background type
      </span>
      <Dropdown
        api={this.props.api}
        fieldKey='backgroundType'
        options={options}
        updater={this.backgroundTypeChangeHandler}
        value={value} />
    </div>
  }

  /**
   * Handle background type change
   * @param fieldKey
   * @param value
   */
  backgroundTypeChangeHandler (fieldKey, value) {
    let newState = lodash.defaultsDeep({}, this.state)
    newState.devices[ newState.currentDevice ].backgroundType = value
    this.updateValue(newState)
  }

  /**
   * Render box model
   * @returns {*}
   */
  getBoxModelRender () {
    if (this.state.devices[ this.state.currentDevice ].display) {
      return null
    }
    let value = this.state.devices[ this.state.currentDevice ].boxModel || {}
    return <div className='vcv-ui-form-group'>
      <BoxModel
        api={this.props.api}
        fieldKey='boxModel'
        updater={this.boxModelChangeHandler}
        value={value} />
    </div>
  }

  /**
   * Handle box model change
   * @param fieldKey
   * @param value
   */
  boxModelChangeHandler (fieldKey, value) {
    let currentValue = this.state.devices[ this.state.currentDevice ].boxModel || {}

    if (!lodash.isEqual(currentValue, value)) {
      let newState = lodash.defaultsDeep({}, this.state)
      // update value
      if (lodash.isEmpty(value)) {
        delete newState.devices[ newState.currentDevice ].boxModel
      } else {
        newState.devices[ newState.currentDevice ].boxModel = value
      }
      this.updateValue(newState)
    }
  }

  /**
   * Render attach image
   * @returns {*}
   */
  getAttachImageRender () {
    let allowedBackgroundTypes = [
      'imagesSimple',
      'imagesSlideshow'
    ]
    let backgroundTypeToSearch = this.state.devices[ this.state.currentDevice ].backgroundType
    if (!backgroundTypeToSearch) {
      backgroundTypeToSearch = this.state.backgroundType
    }
    if (this.state.devices[ this.state.currentDevice ].display ||
      allowedBackgroundTypes.indexOf(backgroundTypeToSearch) === -1) {
      return null
    }
    let value = this.state.devices[ this.state.currentDevice ].images || {}
    return <div className='vcv-ui-form-group'>
      <AttachImage
        api={this.props.api}
        fieldKey='attachImage'
        options={{
          multiple: true
        }}
        updater={this.attachImageChangeHandler}
        value={value} />
    </div>
  }

  /**
   * Handle attach image change
   * @param fieldKey
   * @param value
   */
  attachImageChangeHandler (fieldKey, value) {
    if (value.hasOwnProperty(value.draggingIndex)) {
      delete value.draggingIndex
    }
    let newState = lodash.defaultsDeep({}, this.state)
    // update value
    if (lodash.isEmpty(value)) {
      delete newState.devices[ newState.currentDevice ].images
    } else {
      newState.devices[ newState.currentDevice ].images = value
    }
    this.updateValue(newState)
  }

  /**
   * Render background style
   * @returns {*}
   */
  getBackgroundStyleRender () {
    let allowedBackgroundTypes = [
      'imagesSimple',
      'imagesSlideshow'
    ]

    if (this.state.devices[ this.state.currentDevice ].display ||
      allowedBackgroundTypes.indexOf(this.state.devices[ this.state.currentDevice ].backgroundType) === -1 || !this.state.devices[ this.state.currentDevice ].hasOwnProperty('images') ||
      this.state.devices[ this.state.currentDevice ].images.urls.length === 0) {
      return null
    }
    let options = {
      values: [
        {
          label: 'Default',
          value: ''
        },
        {
          label: 'Cover',
          value: 'cover'
        },
        {
          label: 'Contain',
          value: 'contain'
        },
        {
          label: 'Full width',
          value: 'full-width'
        },
        {
          label: 'Full height',
          value: 'full-height'
        },
        {
          label: 'Repeat',
          value: 'repeat'
        },
        {
          label: 'Repeat horizontal',
          value: 'repeat-x'
        },
        {
          label: 'Repeat vertical',
          value: 'repeat-y'
        },
        {
          label: 'No repeat',
          value: 'no-repeat'
        }
      ]
    }
    let value = this.state.devices[ this.state.currentDevice ].backgroundStyle || ''
    return <div className='vcv-ui-form-group'>
      <span className='vcv-ui-form-group-heading'>
        Background style
      </span>
      <Dropdown
        api={this.props.api}
        fieldKey='backgroundStyle'
        options={options}
        updater={this.backgroundStyleChangeHandler}
        value={value} />
    </div>
  }

  /**
   * Handle background style change
   * @param fieldKey
   * @param value
   */
  backgroundStyleChangeHandler (fieldKey, value) {
    let newState = lodash.defaultsDeep({}, this.state)
    newState.devices[ newState.currentDevice ].backgroundStyle = value
    this.updateValue(newState)
  }

  /**
   * @returns {XML}
   */
  render () {
    return (
      <div className='advanced-design-options'>
        {this.getDevicesRender()}
        <div className='vcv-ui-row vcv-ui-row-gap--md'>
          <div className='vcv-ui-col vcv-ui-col--fixed-width'>
            {this.getDeviceVisibilityRender()}
            {this.getBoxModelRender()}
          </div>
          <div className='vcv-ui-col vcv-ui-col--fixed-width'>
            {this.getBackgroundTypeRender()}
            {this.getAttachImageRender()}
            {this.getBackgroundStyleRender()}
          </div>
        </div>
      </div>
    )
  }
}

export default DesignOptionsAdvanced
