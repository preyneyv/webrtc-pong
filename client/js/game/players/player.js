/** @typedef {import('../game').default} GameInstance */

export default class Player {
  /**
   *
   * @param {GameInstance} game
   * @param {number} playerIdx
   */
  bindToGame(game, playerIdx) {
    this.game = game
    this.playerIdx = playerIdx
  }
}
