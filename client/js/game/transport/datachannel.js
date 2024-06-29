import BaseTransport from './base.js'

export default class DataChannelTransport extends BaseTransport {
  /**
   * @param {RTCDataChannel} channel
   */
  constructor(channel) {
    super()
    this.channel = channel
  }
}
