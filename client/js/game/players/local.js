/** @typedef {import('../paddle.js').PaddleInput} PaddleInput */
/** @typedef {import('./base.js').BaseControllerConfig} BaseControllerConfig */
/** @typedef {import('./support/socd.js').SOCDCleanerType} SOCDCleanerType */

import BaseController from './base.js'
import { SOCDCleaner } from './support/socd.js'

/**
 * A superclass for all locally-driven paddles. Handles things like input
 * cleaning.
 */
export default class LocalPlayer extends BaseController {
  rawButtons = 0

  /** @type {SOCDCleaner} */
  verticalCleaner

  /**
   *
   * @param {BaseControllerConfig} config
   */
  constructor({ socdVertical } = {}) {
    super({ socdVertical })
  }
}

/** @typedef {Partial<BaseControllerConfig> & {
 *   keybinds: Record<string, PaddleInput>
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
      ArrowUp: 'Up',
      ArrowDown: 'Down',
    },
    socdVertical,
  } = {}) {
    super({ socdVertical })
    this.keybinds = keybinds

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
