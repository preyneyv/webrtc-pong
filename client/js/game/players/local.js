/** @typedef {import('./base.js').PaddleInput} PaddleInput */
/** @typedef {import('./support/socd.js').SOCDCleanerType} SOCDCleanerType */

import { setBit } from '../../utils.js'
import BasePlayer, { PADDLE_MASKS } from './base.js'
import getSOCDCleaner, { SOCDCleaner } from './support/socd.js'

/** @typedef {{
 *   socdVertical: SOCDCleanerType
 * }} LocalPlayerConfig */

/**
 * A superclass for all locally-driven paddles. Handles things like input
 * cleaning.
 */
export default class LocalPlayer extends BasePlayer {
  rawButtons = 0

  /** @type {SOCDCleaner} */
  verticalCleaner

  /**
   *
   * @param {LocalPlayerConfig} config
   */
  constructor({ socdVertical = 'lastInput' } = {}) {
    super()
    this.verticalCleaner = getSOCDCleaner(socdVertical)
  }

  /**
   * @param {PaddleInput} input
   * @param {boolean} pressed
   */
  processInput(input, pressed) {
    const mask = PADDLE_MASKS[input]
    this.rawButtons = setBit(this.rawButtons, mask, pressed)

    let state = setBit(this.buttons, mask, pressed)

    // Process SOCD for vertical input
    if (input === 'Down' || input === 'Up') {
      const positive = this.rawButtons & PADDLE_MASKS.Up
      const negative = this.rawButtons & PADDLE_MASKS.Down

      const cleaned = this.verticalCleaner.clean(positive, negative)

      state = setBit(state, PADDLE_MASKS.Up, cleaned === 1)
      state = setBit(state, PADDLE_MASKS.Down, cleaned === -1)
    }

    this.setButtonState(state)
  }
}

/** @typedef {Partial<LocalPlayerConfig> & {
 *   keybinds: Record<string, PaddleInput>
 * }} KeyboardLocalPlayerConfig */

/** @type {KeyboardLocalPlayerConfig} */
export const defaultKeyboardLocalPlayerConfig = {}

/**
 * A LocalPlayer that binds to keyboard events.
 */
export class KeyboardLocalPlayer extends LocalPlayer {
  /**
   * @param {KeyboardLocalPlayerConfig} config
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
