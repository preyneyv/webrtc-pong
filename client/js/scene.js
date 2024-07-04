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

// export const joinForm = new Scene('#scene-join-form')
// export const inQueue = new Scene('#scene-in-queue')
// export const game = new Scene('#scene-game')
