import { PublishButtonsPacket } from '../packets.js'
import BasePlayer from './base.js'

export default class RemotePlayer extends BasePlayer {
  /**
   *
   * @param {PublishButtonsPacket} packet
   */
  handlePublishButtons(packet) {
    this.setButtonState(packet.buttons)
  }
}
