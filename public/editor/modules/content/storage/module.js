import vcCake from 'vc-cake'

const cook = vcCake.getService('cook')

vcCake.add('storage', (api) => {
  const DocumentData = api.getService('document')
  api.reply('data:add', (elementData) => {
    let cratedElements = []
    let element = cook.get(elementData)
    if (!element.get('parent') && !element.relatedTo([ 'RootElements' ])) {
      let rowElement = DocumentData.create({ tag: 'row' })
      cratedElements.push(rowElement.id)
      let columnElement = DocumentData.create({ tag: 'column', parent: rowElement.id })
      cratedElements.push(columnElement.id)
      elementData.parent = columnElement.id
    }
    let data = DocumentData.create(elementData)
    cratedElements.push(data.id)

    if (element.get('tag') === 'row') {
      let columnData = cook.get({ tag: cook.getTagByName('Column'), parent: data.id })
      if (columnData) {
        let columnElement = DocumentData.create(columnData.toJS())
        cratedElements.push(columnElement.id)
      }
    }

    api.request('data:afterAdd', cratedElements)
    api.request('data:changed', DocumentData.children(false), 'add')
  })

  api.reply('data:remove', (id) => {
    api.request('data:beforeRemove', id)
    DocumentData.delete(id)
    api.request('data:changed', DocumentData.children(false), 'remove')
  })

  api.reply('data:clone', (id) => {
    let dolly = DocumentData.clone(id)
    api.request('data:afterClone', dolly.id)
    api.request('data:changed', DocumentData.children(false), 'clone')
  })

  api.reply('data:update', (id, element) => {
    DocumentData.update(id, element)
    api.request('data:changed', DocumentData.children(false), 'update')
  })

  api.reply('data:move', (id, data) => {
    if (data.action === 'after') {
      DocumentData.moveAfter(id, data.related)
    } else if (data.action === 'append') {
      DocumentData.appendTo(id, data.related)
    } else {
      DocumentData.moveBefore(id, data.related)
    }
    api.request('data:changed', DocumentData.children(false))
  })

  api.reply('data:reset', (content) => {
    DocumentData.reset(content || {})
    api.request('data:changed', DocumentData.children(false), 'reset')
  })
})
