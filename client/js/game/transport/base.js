/** @typedef {import('../game').default} GameInstance */

import { BasePacket, PublishButtonsPacket } from '../packets.js'

/** @typedef {{
 *   absoluteDelay?: number,
 *   jitterDelay?: number,
 * }} BaseTransportConfig */

export default class BaseTransport {
  txCounter = 0
  rxCounter = 0

  /**
   * @param {BaseTransportConfig} config
   */
  constructor({ absoluteDelay = 0, jitterDelay = 0 } = {}) {
    if (absoluteDelay || jitterDelay) {
      // wrap `send` with a delay
      const innerSend = this.send.bind(this)
      this.send = (buffer) =>
        setTimeout(
          () => innerSend(buffer),
          absoluteDelay + jitterDelay * Math.random()
        )
    }
  }

  destroy() {
    /* no op */
  }

  /**
   *
   * @param {GameInstance} game
   */
  bindToGame(game) {
    if (this.game)
      throw new Error('Cannot bind to game: already bound to another.')
    this.game = game
  }

  /**
   * Send the given message over the transport
   * @abstract
   * @protected
   * @param {ArrayBuffer} buffer
   */
  send(buffer) {
    throw new Error('not implemented')
  }

  /**
   * Handle the reception of a new packet and route it to the appropriate
   * consumer.
   * @protected
   * @param {ArrayBuffer} buffer
   */
  onRecv(buffer) {
    const packet = BasePacket.unmarshal(buffer)
    this.game.handlePacket(packet)
  }

  /**
   *
   * @param {BasePacket} packet
   */
  sendPacket(packet) {
    this.send(packet.marshal())
  }

  /**
   * Publish a button state update
   * @abstract
   * @param {number} playerIdx
   * @param {number} buttons
   */
  publishButtons(playerIdx, buttons) {
    const packet = new PublishButtonsPacket(
      this.txCounter++,
      this.game.tick,
      playerIdx,
      buttons
    )
    this.sendPacket(packet)
  }
}
