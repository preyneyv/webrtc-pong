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
  socd = 0

  /**
   *
   * @param {Partial<PlayerState>} state
   */
  constructor(state) {
    Object.assign(this, state)
  }
}

/**
 * Transport-agnostic player implementation to handle local rendering and
 * physics
 */
export default class BasePlayer {
  state = new PlayerState({})
  buttons = 0

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
  }

  /**
   *
   * @param {PaddleInput} inputFlag
   * @param {boolean} pressed
   */
  setInput(inputFlag, pressed) {
    const oldState = this.buttons
    let newState = oldState
    if (pressed) newState |= PADDLE_MASKS[inputFlag]
    else newState &= ~PADDLE_MASKS[inputFlag]

    if (newState !== oldState) {
      console.log('changed', newState)
      // const buf = new Uint8Array()
      // this.channel.send(new ArrayBuffer(2))
    }
    this.buttons = newState
  }

  /**
   * @param {number} tick
   */
  tick(tick) {
    let direction = 0
    if (this.buttons & PADDLE_MASKS.Up && this.buttons & PADDLE_MASKS.Down) {
      direction = this.state.socd
    } else if (this.buttons & PADDLE_MASKS.Up) {
      this.state.socd = 1
      direction = -1
    } else if (this.buttons & PADDLE_MASKS.Down) {
      this.state.socd = -1
      direction = 1
    } else {
      this.state.socd = 0
      direction = 0
    }
    this.state.y += direction * constants.paddleSpeed
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
