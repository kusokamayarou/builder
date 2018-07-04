/* eslint-disable import/no-webpack-loader-syntax */
import React from 'react'
import lodash from 'lodash'
import Attribute from '../attribute'
import Toggle from '../toggle/Component'

export default class Sticky extends Attribute {
  static deviceDefaults = {
    stickyEnable: false
  }
  static defaultState = {
    currentDevice: 'all',
    devices: {}
  }

  constructor (props) {
    super(props)

    this.valueChangeHandler = this.valueChangeHandler.bind(this)
  }

  updateState (props) {
    let newState = {}
    // data came from props if there is set value
    if (props.value) {
      newState = this.parseValue(props.value)
    } else {
      // data came from state update
      newState = lodash.defaultsDeep({}, props, Sticky.defaultState)
    }
    return newState
  }

  parseValue (value) {
    // set default values
    let newState = lodash.defaultsDeep({}, Sticky.defaultState)
    // get devices data
    let devices = []
    // set current device
    if (!lodash.isEmpty(value.device)) {
      newState.currentDevice = Object.keys(value.device).shift()
    }
    // update devices values
    devices.push('all')
    devices.forEach((device) => {
      newState.devices[ device ] = lodash.defaultsDeep({}, Sticky.deviceDefaults)
      if (value.device && value.device[ device ]) {
        newState.devices[ device ] = lodash.defaultsDeep({}, value.device[ device ], newState.devices[ device ])
      }
    })

    return newState
  }

  updateValue (newState, fieldKey) {
    let newValue = {}

    // prepare data for state
    newState = this.updateState(newState)
    // save only needed data
    let checkDevices = []
    if (newState.currentDevice === 'all') {
      checkDevices.push('all')
    }

    checkDevices.forEach((device) => {
      if (!lodash.isEmpty(newState.devices[ device ])) {
        if (!newState.devices[ device ].stickyEnable) {
          newState.devices[ device ].stickyEnable = Sticky.deviceDefaults.stickyEnable
        }

        newValue[ device ] = lodash.defaultsDeep({}, newState.devices[ device ])

        // remove device from list if it's empty
        if (!Object.keys(newValue[ device ]).length) {
          delete newValue[ device ]
        }
      }
    })

    this.setFieldValue(newValue, fieldKey)
    this.setState(newState)
  }

  setFieldValue (value, innerFieldKey) {
    let { updater, fieldKey } = this.props
    updater(fieldKey, {
      device: value
    }, innerFieldKey)
  }

  valueChangeHandler (fieldKey, value) {
    let newState = lodash.defaultsDeep({}, this.state)
    newState.devices[ newState.currentDevice ][ fieldKey ] = value
    this.updateValue(newState, fieldKey)
  }

  getStickyToggle () {
    let fieldKey = 'stickyEnable'
    let deviceData = this.state.devices[ this.state.currentDevice ]
    let value = deviceData[ fieldKey ] || false
    let labelText = `Enable sticky`

    return (
      <div className='vcv-ui-form-group vcv-ui-form-group-style--inline'>
        <Toggle
          api={this.props.api}
          fieldKey={fieldKey}
          updater={this.valueChangeHandler}
          options={{ labelText: labelText }}
          value={value}
        />
      </div>
    )
  }

  render () {
    return (
      <div className='vcv-ui-sticky-section'>
        <div className='vcv-ui-row vcv-ui-row-gap--md'>
          <div className='vcv-ui-col vcv-ui-col--fixed-width'>
            {this.getStickyToggle()}
          </div>
        </div>
      </div>
    )
  }
}
