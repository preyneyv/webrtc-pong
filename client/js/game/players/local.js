/** @typedef {import('./base.js').PaddleInput} PaddleInput */
import BasePlayer from './base.js'

/** @type {{ [key: string]: PaddleInput }} */
export const PADDLE_INPUT_LOOKUP = {
  ArrowUp: 'Up',
  ArrowDown: 'Down',
}

export default class LocalPlayer extends BasePlayer {
  /**
   * @param {RTCDataChannel} channel
   */
  constructor(channel) {
    super()
    this.channel = channel

    window.addEventListener('keydown', (e) => {
      const flag = PADDLE_INPUT_LOOKUP[e.key]
      if (flag === undefined) return // ignored key
      e.preventDefault()
      this.setInput(flag, true)
    })

    window.addEventListener('keyup', (e) => {
      const flag = PADDLE_INPUT_LOOKUP[e.key]
      if (flag === undefined) return // ignored key
      e.preventDefault()
      this.setInput(flag, false)
    })
  }
}
