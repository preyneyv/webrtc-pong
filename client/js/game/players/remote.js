import { BasePacket, PublishButtonsPacket } from '../packets.js'
import BasePlayer from './base.js'

export default class RemotePlayer extends BasePlayer {
  setup() {
    this.game.on(
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
