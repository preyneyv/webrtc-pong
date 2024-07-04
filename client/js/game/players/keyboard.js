/** @typedef {import('../paddle.js').PaddleInput} PaddleInput */
/** @typedef {import('./base.js').BaseControllerConfig} BaseControllerConfig */

import BaseController from './base.js'

/** @typedef {Partial<BaseControllerConfig> & {
 *   keybinds: Record<PaddleInput, string>
 * }} KeyboardControllerConfig */

/**
 * A Controller that binds to keyboard events.
 */
export class KeyboardController extends BaseController {
  /**
   * @param {KeyboardControllerConfig} config
   */
  constructor({
    keybinds = {
      Up: 'ArrowUp',
      Down: 'ArrowDown',
    },
    socdVertical,
  } = {}) {
    super({ socdVertical })
    // invert the keybinds object
    this.keybinds = Object.entries(keybinds).reduce(
      (acc, [input, keyCode]) => ((acc[keyCode] = input), acc),
      {}
    )

    this.keydownListener = this.keydownListener.bind(this)
    this.keyupListener = this.keyupListener.bind(this)

    window.addEventListener('keydown', this.keydownListener)
    window.addEventListener('keyup', this.keyupListener)
  }

  /**
   * @param {KeyboardEvent} e
   */
  keydownListener(e) {
    const input = this.keybinds[e.code]
    if (input === undefined) return // ignore key
    e.preventDefault()
    e.stopPropagation()
    this.processInput(input, true)
  }

  /**
   * @param {KeyboardEvent} e
   */
  keyupListener(e) {
    const input = this.keybinds[e.code]
    if (input === undefined) return // ignore key
    e.preventDefault()
    e.stopPropagation()
    this.processInput(input, false)
  }
}
