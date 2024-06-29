/** @typedef {import('../game').default} GameInstance */
export default class BaseTransport {
  /**
   *
   * @param {GameInstance} game
   */
  bindToGame(game) {
    if (this.game)
      throw new Error('Cannot bind to game: already bound to another.')
    this.game = game
  }
}
