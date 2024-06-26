import BaseTransport from './base.js'

export default class DataChannelTransport extends BaseTransport {
  /**
   * @param {RTCDataChannel} channel
   * @param {import('./base.js').BaseTransportConfig} config
   */
  constructor(channel, config = {}) {
    super(config)

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
    this.channel.send(packet)
  }
}
