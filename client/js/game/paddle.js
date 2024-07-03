/** @typedef {import('./game.js').default} GameInstance */

import constants from './constants.js'

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
export class PaddleState {
  y = (constants.height - constants.paddleHeight) / 2
  vy = 0
  buttons = 0
}

/**
 * Transport-agnostic player implementation to handle local rendering and
 * physics
 */
export default class Paddle {
  state = new PaddleState()

  /**
   * @param {GameInstance} game
   * @param {number} playerIdx
   */
  constructor(game, playerIdx) {
    this.game = game
    this.playerIdx = playerIdx
    this.paddleX = playerIdx === 0 ? 0 : constants.width - constants.paddleWidth
  }

  destroy() {
    /* no op */
  }

  freeze() {
    return structuredClone(this.state)
  }

  /**
   * @param {PaddleState} state
   */
  restoreState(state) {
    Object.assign(this.state, state)
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
   * @param {number} buttons
   */
  setButtonState(buttons) {
    this.state.buttons = buttons
  }

  /**
   * @param {number} tick
   */
  tick(tick) {
    let { vy, y } = this.state
    let direction = 0
    if (this.isPressed('Up') && this.isPressed('Down')) {
      // SOCD: Neutral
      direction = 0
      console.warn('[BasePlayer] Unexpected SOCD encountered')
    } else if (this.isPressed('Up')) {
      direction = -1
    } else if (this.isPressed('Down')) {
      direction = 1
    } else {
      direction = 0
    }

    if (direction === 0) {
      vy = Math.trunc(vy * 0.9 * 100) / 100
    } else {
      vy = direction * constants.paddleSpeed
    }
    y += vy
    if (y < 0) {
      y = 0
      vy = 0
    }
    if (y + constants.paddleHeight > constants.height) {
      y = constants.height - constants.paddleHeight
      vy = 0
    }

    Object.assign(this.state, { vy, y })
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

    // ctx.globalAlpha = 0.15
    // ctx.font = '32px "Space Grotesk", sans-serif'
    // ctx.textAlign = 'center'
    // ctx.textBaseline = 'middle'
    // ctx.fillText(
    //   this.username.slice(0, 16),
    //   this.playerIdx === 0 ? constants.width / 4 : (constants.width * 3) / 4,
    //   constants.height / 2 + 120
    // )
    ctx.restore()
  }
}
