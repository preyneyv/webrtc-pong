import { $ } from './lib/utils.js'

export default class Scene {
  constructor(selector) {
    this.el = $(selector)
  }

  show() {
    this.el.classList.add('show')
  }

  hide() {
    this.el.classList.remove('show')
  }

  /**
   * @param {string} selector
   * @returns {Element}
   */
  $(selector) {
    return this.el.querySelector(selector)
  }
}
