/** @typedef {import('./players/player').default} Player */

const WIDTH = 1280
const HEIGHT = 720

export default class GameInstance {
  /**
   * @param {Player} player1
   * @param {Player} player2
   * @param {HTMLCanvasElement} canvasEl
   */
  constructor(player1, player2, canvasEl) {
    this.player1 = player1
    player1.bindToGame(this, 0)

    this.player2 = player2
    player2.bindToGame(this, 1)

    this.canvasEl = canvasEl
    canvasEl.width = WIDTH
    canvasEl.height = HEIGHT
    this.ctx = canvasEl.getContext('2d')
  }
}
