/** @typedef {import('./players/base.js').default} BasePlayer */
/** @typedef {import('./transport/base.js').default} BaseTransport */

import constants from './constants.js'

const WIDTH = 1280
const HEIGHT = 720

export default class GameInstance {
  tick = 0
  /**
   * @param {BaseTransport} transport
   * @param {BasePlayer} player1
   * @param {Player} player2
   * @param {HTMLCanvasElement} canvasEl
   */
  constructor(transport, player1, player2, canvasEl) {
    this.render = this.render.bind(this)

    this.transport = transport

    this.player1 = player1
    player1.bindToGame(this, 0)

    this.player2 = player2
    player2.bindToGame(this, 1)

    this.canvasEl = canvasEl
    canvasEl.width = WIDTH
    canvasEl.height = HEIGHT
    this.ctx = canvasEl.getContext('2d')

    this.startedAt = performance.now()
    requestAnimationFrame(this.render)
  }

  /**
   * @param {DOMHighResTimeStamp} pts
   */
  render(pts) {
    const elapsed = pts - this.startedAt
    const targetTick = Math.floor((elapsed * constants.tickRate) / 1000)
    while (this.tick < targetTick) {
      this.player1.tick(this.tick)
      this.player2.tick(this.tick)
      this.tick++
    }

    this.ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height)
    this.player1.render(this.ctx)
    this.player2.render(this.ctx)

    requestAnimationFrame(this.render)
  }
}
