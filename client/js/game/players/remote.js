import { BasePacket, PublishButtonsPacket } from '../packets.js'
import BasePlayer from './base.js'

export default class RemotePlayer extends BasePlayer {
  setup() {
    this.packetListener = this.game.on(
      'packet',
      /**
       * @param {BasePacket} packet
       */
      (packet) => {
        let publishPacket = packet.downcast(PublishButtonsPacket)
        if (publishPacket) {
          if (publishPacket.playerIdx === this.playerIdx)
            this.handlePublishButtons(publishPacket)
        }
      }
    )
  }
  destroy() {
    this.packetListener.destroy()
  }

  /**
   *
   * @param {PublishButtonsPacket} packet
   */
  handlePublishButtons(packet) {
    // console.log('handlePublishButtons', this.game.tick, packet)
    this.setButtonState(packet.buttons)
  }

  restoreInputs() {
    /* no op */
  }
}
