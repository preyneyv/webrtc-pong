import Player from './player.js'

export default class RemotePlayer extends Player {
  /**
   *
   * @param {RTCDataChannel} channel
   */
  constructor(channel) {
    super()
    this.channel = channel
  }
}
