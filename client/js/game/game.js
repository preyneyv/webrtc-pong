/** @typedef {import('./players/base.js').default} BasePlayer */
/** @typedef {import('./transport/base.js').default} BaseTransport */

import constants from './constants.js'
import { BasePacket, PublishButtonsPacket } from './packets.js'
import RemotePlayer from './players/remote.js'
import { RingBuffer } from './rollback.js'

export default class GameInstance {
  tick = 0

  /** @type {BasePacket[]} */
  packetQueue = []

  rollbackStateBuffer = new RingBuffer(constants.rollbackBufferSize)

  /**
   * @param {BaseTransport} transport
   * @param {[BasePlayer, BasePlayer]} players
   * @param {HTMLCanvasElement} canvasEl
   */
  constructor(transport, players, canvasEl) {
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

    this.isRunning = true
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.isRunning = false
        console.log('FREEZE')
        console.log(this)
      }
    })
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

  doTick() {
    this.players.map((player) => player.tick(this.tick))
    this.tick++
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
    if (!this.isRunning) return
    const currentTick = this.tick
    if (this.packetQueue.length) {
      // sort buffer in packet order
      this.packetQueue.sort((a, b) => a.idx - b.idx)
      const earliestTick = this.packetQueue[0].tick
      const delta = currentTick - earliestTick
      // console.log(
      //   'processing packet rollback',
      //   earliestTick,
      //   currentTick,
      //   packetQueue
      // )

      // console.log(earliestTick, currentTick)
      if (earliestTick < currentTick) {
        // initiate a rollback

        // rewind to right before target tick
        const targetState = this.rollbackStateBuffer.retrieve(delta + 1)
        // console.log(targetTick, currentTick, delta, targetState)
        if (!targetState) {
          console.error('No rollback state for', earliestTick)
          return
        }
        this.restoreState(targetState, true)
      }
      // while (this.tick < currentTick) {
      //   // console.log('rollback', this.tick, adjustedDelta)
      //   // console.log('ticks', this.tick, targetTick, currentTick, adjustedDelta)
      //   const stateBufferOffset = currentTick - this.tick
      //   this.restoreInputs(this.rollbackStateBuffer.retrieve(stateBufferOffset))

      //   // apply rollback packets as necessary
      //   for (let i = 0; i < this.packetQueue.length; i++) {
      //     const packet = this.packetQueue[i]
      //     if (packet.tick < this.tick) continue
      //     else if (packet.tick > this.tick) break

      //     if (packet instanceof PublishButtonsPacket) {
      //       /** @type {RemotePlayer} */ this.players[
      //         packet.playerIdx
      //       ].handlePublishButtons(packet)
      //     }
      //   }
      //   this.doTick()
      //   this.rollbackStateBuffer.set(stateBufferOffset, this.freeze())
      // }
    }
    const elapsed = pts - this.startedAt
    const endTick = Math.floor((elapsed * constants.tickRate) / 1000)
    // if (this.tick === endTick && havePackets) console.warn('skip')
    let queueProcessPointer = 0
    while (this.tick < endTick) {
      const isTimeTravelling = this.tick < currentTick
      const stateBufferOffset = currentTick - this.tick

      if (isTimeTravelling) {
        // console.log('rollback', this.tick, currentTick, endTick)
        // restore inputs to what they were in the past
        this.restoreInputs(this.rollbackStateBuffer.retrieve(stateBufferOffset))
      }

      // this.packetQueue.length &&
      // console.log('tick master', this.tick, this.packetQueue)
      // process incoming packets
      // if (packetQueue.length) {
      //   console.log('tick packet', this.tick, this.packetQueue)
      // }
      // if (havePackets)
      // console.log('pktcompare', havePackets, packetQueue.length, packetQueue)
      // if (packetQueue.length) console.log('packets', packetQueue)
      for (
        ;
        queueProcessPointer < this.packetQueue.length;
        queueProcessPointer++
      ) {
        const packet = this.packetQueue[queueProcessPointer]
        if (packet.tick > this.tick) break
        // if (packet.tick < this.tick) continue
        // else if (packet.tick > this.tick) break

        if (packet instanceof PublishButtonsPacket) {
          /** @type {RemotePlayer} */ this.players[
            packet.playerIdx
          ].handlePublishButtons(packet)
        }
      }

      this.doTick()

      const frozenState = this.freeze()
      if (isTimeTravelling) {
        // overwrite previous state
        this.rollbackStateBuffer.set(stateBufferOffset, frozenState)
      } else {
        // save new state
        this.rollbackStateBuffer.push(frozenState)
      }
    }
    if (this.packetQueue.length)
      console.log(
        'ptr',
        queueProcessPointer,
        this.packetQueue.length,
        this.packetQueue
      )
    // this.packetQueue.push(...this.packetQueue.slice(queueProcessPointer))
    this.packetQueue = this.packetQueue.slice(queueProcessPointer)

    this.ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height)
    this.players.map((player) => player.render(this.ctx))

    requestAnimationFrame(this.render)
  }
}
