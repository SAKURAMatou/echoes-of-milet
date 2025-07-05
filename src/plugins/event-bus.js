// import Vue from 'vue'

/**
 * 自定义一个event bus
 */
const eventBus = {
  events: {},
  /**
   * 注册事件
   * @param {*} event
   * @param {*} handler
   */
  on(event, handler) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(handler)
  },
  off(event, handler) {
    if (!this.events[event]) {
      return
    }
    //删除事件列表中的所有是当前handler的对象，防止多次注册情况下漏删
    this.events[event] = this.events[event].filter((fn) => fn !== handler)
  },
  emit(event, payload) {
    if (!this.events[event]) {
      return
    }
    this.events[event].forEach((fn) => fn(payload))
  },
}
export default eventBus
