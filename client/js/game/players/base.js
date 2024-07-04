/** @typedef {import('./support/socd.js').SOCDCleanerType} SOCDCleanerType */

import { setBit } from '../../lib/utils.js'
import { PADDLE_MASKS } from '../paddle.js'
import getSOCDCleaner from './support/socd.js'

/** @typedef {{
 *   socdVertical: SOCDCleanerType,
 * }} BaseControllerConfig */

/** @typedef {import('../game').default} GameInstance */
export default class BaseController {
  /** @type {GameInstance} */
  game

  lastButtons = 0
  rawButtons = 0

  /**
   *
   * @param {BaseControllerConfig} config
   */
  constructor({ socdVertical = 'lastInput' } = {}) {
    this.verticalCleaner = getSOCDCleaner(socdVertical)
  }

  /**
   * @param {GameInstance} game
   * @param {number} playerIdx
   */
  bindToGame(game, playerIdx) {
    if (this.game)
      throw new Error('Cannot bind to game: already bound to another.')
    this.game = game
    this.playerIdx = playerIdx
  }

  /**
   * Helper function for controllers with "press" and "release" events.
   * @param {PaddleInput} input
   * @param {boolean} pressed
   */
  processInput(input, pressed) {
    const mask = PADDLE_MASKS[input]

    this.processRawButtons(setBit(this.rawButtons, mask, pressed))
  }

  /**
   * Handle raw button data from the controller and process SOCD
   * @param {number} buttons
   */
  processRawButtons(buttons) {
    this.rawButtons = buttons
    let state = buttons

    // Process SOCD for vertical input
    const positive = this.rawButtons & PADDLE_MASKS.Up
    const negative = this.rawButtons & PADDLE_MASKS.Down

    const cleaned = this.verticalCleaner.clean(positive, negative)

    state = setBit(state, PADDLE_MASKS.Up, cleaned === 1)
    state = setBit(state, PADDLE_MASKS.Down, cleaned === -1)

    if (state !== this.lastButtons) {
      this.lastButtons = state
      this.game.transport.publishButtons(this.playerIdx, state)
    }
  }
}
