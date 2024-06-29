import Player from './player.js'

export default class LocalPlayer extends Player {
  state = 0
  /**
   * @param {RTCDataChannel} channel
   */
  constructor(channel) {
    super()
    this.channel = channel

    window.addEventListener('keydown', (e) => {
      const flag = this.bitFlag(e.key)
      if (flag === -1) return // ignored key
      e.preventDefault()
      this.setFlag(flag, true)
    })

    window.addEventListener('keyup', (e) => {
      const flag = this.bitFlag(e.key)
      if (flag === -1) return // ignored key
      e.preventDefault()
      this.setFlag(flag, false)
    })
  }

  bitFlag(key) {
    switch (key) {
      case 'ArrowDown':
        return 0
      case 'ArrowUp':
        return 1
    }
    return -1
  }

  setFlag(flag, pressed) {
    const oldState = this.state
    let newState = oldState
    if (pressed) newState |= 1 << flag
    else newState &= ~(1 << flag)
    if (newState !== oldState) {
      const buf = new Uint8()
      this.channel.send(new ArrayBuffer(2))
    }
    this.state = newState
  }
}
