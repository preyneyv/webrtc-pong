import Player from './player.js'

export default class LocalPlayer extends Player {
  /**
   * @param {RTCDataChannel} channel
   */
  constructor(channel) {
    super()
    this.channel = channel
  }
}
