import BaseTransport from './base.js'
export default class DataChannelTransport extends BaseTransport {
  /**
   * @param {RTCDataChannel} channel
   */
  constructor(channel) {
    super()

    this.onChannelMessage = this.onChannelMessage.bind(this)

    this.channel = channel
    this.channel.addEventListener('message', this.onChannelMessage)
  }

  destroy() {
    this.channel.removeEventListener('message', this.onChannelMessage)
    super.destroy()
  }

  /**
   *
   * @param {MessageEvent<ArrayBuffer>} e
   */
  onChannelMessage({ data }) {
    this.onRecv(data)
  }

  /** @type {BaseTransport['send']} */
  send(packet) {
    setTimeout(() => this.channel.send(packet), 150)
    // this.channel.send(packet)
  }
}
