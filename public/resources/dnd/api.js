export default class API {
  /**
   * @param {DnD} dnd
   */
  constructor (dnd) {
    this.dnd = dnd
  }
  start (data) {
    this.dnd.start(data.id)
    this.dnd.manualScroll = true
    data.point && this.dnd.check(data.point)
  }
  addNew (data) {
    this.dnd.start(data.id, false, data.tag, data.domNode)
    this.dnd.manualScroll = true
    data.point && this.dnd.check(data.point)
  }
}
