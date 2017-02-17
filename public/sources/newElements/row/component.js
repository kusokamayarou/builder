import React from 'react'
import vcCake from 'vc-cake'
const vcvAPI = vcCake.getService('api')

export default class RowElement extends vcvAPI.elementComponent {
  render () {
    let { id, atts, editor } = this.props
    let { customClass, rowWidth, removeSpaces, columnGap, fullHeight, metaCustomId, equalHeight, columnPosition, contentPosition, size, background } = atts
    let content = this.props.children

    let classes = [ 'vce-row' ]

    if (vcCake.env('FEATURE_CUSTOM_ROW_LAYOUT')) {
      if (background) {
        if (background.all) {
          classes.push('vce-element--has-background')
        } else {
          for (let device in background) {
            if (background[ device ] && device !== 'all') {
              classes.push('vce-element--' + device + '--has-background')
            }
          }
        }
      }

      let layoutSize = size && size.constructor === Array ? size.join('--').split('/').join('-') : 'auto'

      classes.push(`vce-row-layout--xs_${layoutSize}`)
      classes.push(`vce-row-layout--sm_${layoutSize}`)
      classes.push(`vce-row-layout--md_${layoutSize}`)
      classes.push(`vce-row-layout--lg_${layoutSize}`)
      classes.push(`vce-row-layout--xl_${layoutSize}`)
      classes.push('vce-row-layout-custom')
    }
    let customProps = {
      style: {}
    }
    let customRowProps = {
      style: {}
    }
    const classNames = require('classnames')
    // reverse classes.push('vce-row-wrap--reverse')
    if (typeof customClass === 'string' && customClass) {
      classes.push(customClass)
    }

    if (!vcCake.env('FEATURE_CUSTOM_ROW_LAYOUT')) {
      if (parseInt(columnGap)) {
        let mixinData = this.getMixinData('columnGap')
        if (mixinData) {
          classes.push(`vce-row--gap-${mixinData.selector}`)
        }
      }
    }

    if (rowWidth === 'stretchedRow' || rowWidth === 'stretchedRowAndColumn') {
      customRowProps[ 'data-vce-full-width' ] = true
    } else {
      customRowProps.style.width = ''
      customRowProps.style.left = ''
      customProps.style.paddingLeft = ''
      customProps.style.paddingRight = ''
    }

    if (rowWidth === 'stretchedRowAndColumn') {
      customRowProps[ 'data-vce-stretch-content' ] = true
    }

    if (rowWidth === 'stretchedRowAndColumn' && removeSpaces) {
      classes.push('vce-row-no-paddings')
    }

    if (fullHeight) {
      classes.push('vce-row-full-height')
    } else {
      customRowProps.style.minHeight = ''
    }

    if (equalHeight && columnPosition !== 'stretch') {
      classes.push('vce-row-equal-height')
    }

    if (columnPosition) {
      classes.push(`vce-row-columns--${columnPosition}`)
    }

    if (contentPosition) {
      classes.push(`vce-row-content--${contentPosition}`)
    }

    let className = classNames(classes)

    if (metaCustomId) {
      customRowProps.id = metaCustomId
    }

    let doAll = this.applyDO('all')

    return <div className='vce-row-container'>
      <div className={className} {...customRowProps} {...editor} id={'el-' + id} {...doAll}>
        {this.getBackgroundTypeContent()}
        <div className='vce-row-content' {...customProps}>
          {content}
        </div>
      </div>
    </div>
  }
}
