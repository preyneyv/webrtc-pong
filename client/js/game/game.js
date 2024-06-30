/** @typedef {import('./players/base.js').default} BasePlayer */
/** @typedef {import('./transport/base.js').default} BaseTransport */

import constants from './constants.js'

export default class GameInstance {
  tick = 0
  /**
   * @param {BaseTransport} transport
   * @param {[BasePlayer, BasePlayer]} players
   * @param {HTMLCanvasElement} canvasEl
   */
  constructor(transport, players, canvasEl) {
    this.render = this.render.bind(this)

    this.transport = transport
    transport.bindToGame(this)

    this.players = players
    players.map((player, i) => player.bindToGame(this, i))

    this.canvasEl = canvasEl
    canvasEl.width = constants.width
    canvasEl.height = constants.height
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
      this.players.map((player) => player.tick(this.tick))
      this.tick++
    }

    this.ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height)
    this.players.map((player) => player.render(this.ctx))

    requestAnimationFrame(this.render)
  }
}
