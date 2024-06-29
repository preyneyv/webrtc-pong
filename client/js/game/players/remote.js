import BasePlayer from './base.js'

export default class RemotePlayer extends BasePlayer {
  /**
   *
   * @param {RTCDataChannel} channel
   */
  constructor(channel) {
    super()
    this.channel = channel
  }
}
