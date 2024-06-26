/** @typedef {import('../game.js').default} GameInstance */

import constants from '../constants.js'

/**
 * Mapping of inputs to their associated bit index
 * @readonly
 * @enum {number}
 */
export const PaddleBitFlags = {
  Down: 0,
  Up: 1,
}

/** @typedef {keyof typeof PaddleBitFlags} PaddleInput */

/** Mapping of inputs to their associated bit masks
 * @type {Record<PaddleInput, number>} */
export const PADDLE_MASKS = Object.entries(PaddleBitFlags).reduce(
  (acc, [key, value]) => ((acc[key] = 1 << value), acc),
  {}
)

/**
 * Serializable player state object
 */
export class PlayerState {
  y = (constants.height - constants.paddleHeight) / 2
  buttons = 0
}

/**
 * Transport-agnostic player implementation to handle local rendering and
 * physics
 */
export default class BasePlayer {
  state = new PlayerState()

  /**
   * @param {GameInstance} game
   * @param {number} playerIdx
   */
  bindToGame(game, playerIdx) {
    if (this.game)
      throw new Error('Cannot bind to game: already bound to another.')
    this.game = game
    this.playerIdx = playerIdx
    this.paddleX = playerIdx === 0 ? 0 : constants.width - constants.paddleWidth

    this.setup()
  }

  /**
   * Called a single time when this Player object is attached to a game.
   */
  setup() {
    /* no op */
  }

  freeze() {
    return structuredClone(this.state)
  }

  /**
   * @param {PlayerState} state
   */
  restoreState(state) {
    Object.assign(this.state, state)
  }

  /**
   * @param {PlayerState} state
   */
  restoreInputs(state) {
    this.state.buttons = state.buttons
  }

  /**
   *
   * @param {PaddleInput} input
   */
  isPressed(input) {
    return this.state.buttons & PADDLE_MASKS[input]
  }

  /**
   *
   */
  onButtonStateChange(buttons) {
    /* no op */
  }

  /**
   *
   * @param {number} buttons
   */
  setButtonState(buttons) {
    if (buttons !== this.state.buttons) {
      this.onButtonStateChange(buttons)
    }
    this.state.buttons = buttons
  }

  /**
   * @param {number} tick
   */
  tick(tick) {
    let direction = 0
    if (this.isPressed('Up') && this.isPressed('Down')) {
      // SOCD: Neutral
      direction = 0
      console.warn('[BasePlayer] Unexpecte SOCD encountered')
    } else if (this.isPressed('Up')) {
      direction = -1
    } else if (this.isPressed('Down')) {
      direction = 1
    } else {
      direction = 0
    }
    this.state.y += direction * constants.paddleSpeed
    if (this.state.y < 0) this.state.y = 0
    if (this.state.y + constants.paddleHeight > constants.height)
      this.state.y = constants.height - constants.paddleHeight
  }

  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    ctx.save()
    ctx.fillStyle = 'white'
    ctx.fillRect(
      this.paddleX,
      this.state.y,
      constants.paddleWidth,
      constants.paddleHeight
    )
    ctx.restore()
  }
}
