/** @typedef {import('./players/base.js').default} BasePlayer */
/** @typedef {import('./transport/base.js').default} BaseTransport */

import constants from './constants.js'
import { BasePacket, PublishButtonsPacket } from './packets.js'
import RemotePlayer from './players/remote.js'
import { BackBuffer, RingBuffer } from './rollback.js'
import EventEmitter from './events.js'

export default class GameInstance extends EventEmitter {
  tick = 0

  /** @type {BackBuffer<BasePacket>} */
  packetQueue = new BackBuffer()

  rollbackStateBuffer = new RingBuffer(constants.rollbackBufferSize)

  /**
   * @param {BaseTransport} transport
   * @param {[BasePlayer, BasePlayer]} players
   * @param {HTMLCanvasElement} canvasEl
   */
  constructor(transport, players, canvasEl) {
    super()
    this.render = this.render.bind(this)

    this.transport = transport
    transport.bindToGame(this)

    this.players = players
    players.map((player, i) => player.bindToGame(this, i))

    this.canvasEl = canvasEl
    canvasEl.width = constants.width
    canvasEl.height = constants.height
    this.ctx = canvasEl.getContext('2d')

    this.startedAt = performance.now()
    requestAnimationFrame(this.render)
  }

  freeze() {
    return [this.tick, this.players.map((player) => player.freeze())]
  }

  /**
   * Rewind to the given state.
   * @param {*} state target state
   */
  restoreState(state) {
    const [tick, players] = state
    this.tick = tick
    this.players.forEach((player, i) => player.restoreState(players[i]))
  }

  /**
   * Only restore inputs from the given state.
   */
  restoreInputs(state) {
    const players = state[1]
    this.players.forEach((player, i) => player.restoreInputs(players[i]))
  }

  /**
   * Add the packet to the rollback queue for processing at the next tick
   * @param {BasePacket} packet
   */
  processPacket(packet) {
    this.packetQueue.push(packet)
  }

  /**
   * @param {DOMHighResTimeStamp} pts
   */
  render(pts) {
    const currentTick = this.tick
    const packetQueue = this.packetQueue.swap()
    let processedIdx = 0
    if (packetQueue.length) {
      // sort buffer in packet order
      packetQueue.sort((a, b) => a.idx - b.idx)
      const earliestTick = packetQueue[0].tick
      const delta = currentTick - earliestTick

      if (earliestTick < currentTick) {
        // initiate a rollback

        // rewind to right before target tick
        const targetState = this.rollbackStateBuffer.retrieve(delta + 1)
        if (!targetState) {
          console.error('No rollback state for', earliestTick)
          return
        }
        this.restoreState(targetState, true)
      }
    }
    const elapsed = pts - this.startedAt
    const endTick = Math.floor((elapsed * constants.tickRate) / 1000)
    while (this.tick < endTick) {
      const isTimeTravelling = this.tick < currentTick
      const stateBufferOffset = currentTick - this.tick

      if (isTimeTravelling) {
        // restore inputs to what they were in the past
        this.restoreInputs(this.rollbackStateBuffer.retrieve(stateBufferOffset))
      }

      // process packets at the right timestep
      while (processedIdx < packetQueue.length) {
        const packet = packetQueue[processedIdx]
        if (packet.tick < this.tick) {
          console.error('Too late for packet', packet, this.tick)
          throw new Error('Too late for packet.')
        }
        if (packet.tick > this.tick) break // we're now up-to-date until the "present"

        this.emit('packet', packet)
        // if (packet instanceof PublishButtonsPacket) {
        //   /** @type {RemotePlayer} */ this.players[
        //     packet.playerIdx
        //   ].handlePublishButtons(packet)
        // }
        processedIdx++
      }

      // do physics
      this.players.map((player) => player.tick(this.tick))
      this.tick++

      const frozenState = this.freeze()
      if (isTimeTravelling) {
        // overwrite previous state
        this.rollbackStateBuffer.set(stateBufferOffset, frozenState)
      } else {
        // save new state
        this.rollbackStateBuffer.push(frozenState)
      }
    }

    // re-add unprocessed packets to buffer
    this.packetQueue.push(...packetQueue.slice(processedIdx))

    this.ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height)
    this.players.map((player) => player.render(this.ctx))

    requestAnimationFrame(this.render)
  }
}
