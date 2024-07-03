/** @typedef {import('./game.js').default} GameInstance */

import constants from './constants.js'

export class BallState {
  x = constants.width / 2
  y = constants.height / 2

  vx = -constants.ballSpeed
  vy = 0

  r = constants.ballRadius
  spin = 0
}

export class Ball {
  state = new BallState()

  /**
   * @param {GameInstance} game
   */
  constructor(game) {
    this.game = game
  }

  freeze() {
    return structuredClone(this.state)
  }

  /**
   * @param {BallState} state
   */
  restoreState(state) {
    Object.assign(this.state, state)
  }

  tick() {
    let { vx, vy, x, y, r, spin } = this.state
    const { paddles } = this.game

    vy = ((vy + spin * 1.5 * 100) << 0) / 100
    x = (((x + vx) * 100) << 0) / 100
    y = (((y + vy) * 100) << 0) / 100

    /* TODO: Refactor this into logic with colliders and a physics engine. */
    if (y + r > constants.height) {
      // bottom wall bounce
      y = constants.height - r
      vy = -vy
      spin = ((-spin * 1000 * 0.7) << 0) / 1000
      this.game.anim.add(50, this.impactAnim(x, constants.height, r))
    } else if (y - r < 0) {
      // top wall bounce
      y = r
      vy = -vy
      spin = ((-spin * 1000 * 0.7) << 0) / 1000
      this.game.anim.add(50, this.impactAnim(x, 0, r))
    } else if (
      x + r > constants.width - constants.paddleWidth &&
      y > paddles[1].state.y &&
      y < paddles[1].state.y + constants.paddleHeight
    ) {
      // right paddle bounce
      x = constants.width - constants.paddleWidth - r
      vx = -vx
      spin = paddles[1].state.vy + spin / 2
      this.game.anim.add(
        50,
        this.impactAnim(constants.width - constants.paddleWidth, y, r)
      )
    } else if (
      x - r < constants.paddleWidth &&
      y > paddles[0].state.y &&
      y < paddles[0].state.y + constants.paddleHeight
    ) {
      // left paddle bounce
      x = constants.paddleWidth + r
      vx = -vx
      spin = paddles[0].state.vy + spin / 2
      this.game.anim.add(50, this.impactAnim(constants.paddleWidth, y, r))
    } else if (x - r > constants.width + 10) {
      // left player score
      this.game.recordScore(0)
      x = constants.width / 2
      y = constants.height / 2
      vx = -constants.ballSpeed
      vy = 0
      spin = 0
    } else if (x + r < -10) {
      // right score
      this.game.recordScore(1)
      x = constants.width / 2
      y = constants.height / 2
      vx = constants.ballSpeed
      vy = 0
      spin = 0
    }

    Object.assign(this.state, { x, y, vx, vy, r, spin })
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    const { x, y } = this.state
    ctx.save()
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(x, y, constants.ballRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  /**
   *
   */
  impactAnim(x, y, r) {
    return (ctx, t) => {
      ctx.save()
      ctx.beginPath()
      ctx.arc(x, y, r * (t * 5 + 1), 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255,255,255,${(1 - t) * 0.5})`
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.restore()
    }
  }
}
