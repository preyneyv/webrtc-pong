/** @typedef {import('./players/base.js').default} BasePlayer */
/** @typedef {import('./transport/base.js').default} BaseTransport */

import AnimationController from './animations.js'
import { Ball } from './ball.js'
import constants from './constants.js'
import EventEmitter from './events.js'
import { BasePacket } from './packets.js'
import { BackBuffer, RingBuffer } from './rollback.js'

export default class GameInstance extends EventEmitter {
  tick = 0
  score = [0, 0]
  anim = new AnimationController()

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

    this.ball = new Ball(this)

    this.canvasEl = canvasEl
    canvasEl.width = constants.width
    canvasEl.height = constants.height
    this.ctx = canvasEl.getContext('2d')

    this.startedAt = performance.now()
    requestAnimationFrame(this.render)
  }

  recordScore(playerIdx) {
    this.score[playerIdx]++
    this.anim.add(100, (ctx, t) => {
      ctx.save()
      ctx.globalAlpha = 1 - t
      const grad = ctx.createLinearGradient(
        playerIdx === 0 ? 0 : constants.width,
        0,
        playerIdx === 0 ? constants.width : 0,
        0
      )
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.1)')
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, constants.width, constants.height)
      ctx.font = '36px "Space Grotesk", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'white'
      ctx.fillText(
        'GOAL!',
        playerIdx === 0 ? constants.width / 4 : (constants.width * 3) / 4,
        constants.height / 2 - 130 - t * 30
      )
      ctx.restore()
    })
    console.log('Score:', this.score)
  }

  freeze() {
    return [
      this.tick,
      [this.players[0].freeze(), this.players[1].freeze()],
      this.ball.freeze(),
      structuredClone(this.score),
    ]
  }

  /**
   * Rewind to the given state.
   * @param {*} state target state
   */
  restoreState(state) {
    const [tick, players, ball, score] = state
    this.tick = tick
    this.score = score
    this.players[0].restoreState(players[0])
    this.players[1].restoreState(players[1])
    this.ball.restoreState(ball)
  }

  /**
   * Only restore inputs from the given state.
   */
  restoreInputs(state) {
    const players = state[1]
    this.players[0].restoreInputs(players[0])
    this.players[1].restoreInputs(players[1])
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
        console.log('rolling back', earliestTick, currentTick)
        this.anim.clear(earliestTick)

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
        processedIdx++
      }

      // do physics
      this.players.map((player) => player.tick(this.tick))
      this.ball.tick()
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

    const { ctx } = this
    ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height)
    this.renderScore(ctx)
    this.anim.render(ctx, this.tick)
    this.players.map((player) => player.render(this.ctx))
    this.ball.render(this.ctx)

    requestAnimationFrame(this.render)
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  renderScore(ctx) {
    const size = 240
    const y = constants.height / 2 + size * 0.08
    ctx.save()
    ctx.font = `${size}px "Space Grotesk", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.fillStyle =
      this.score[0] > this.score[1]
        ? 'rgba(255, 255, 255, 0.2)'
        : 'rgba(255, 255, 255, 0.1)'
    ctx.fillText(this.score[0], constants.width / 4, y)
    ctx.fillStyle =
      this.score[1] > this.score[0]
        ? 'rgba(255, 255, 255, 0.2)'
        : 'rgba(255, 255, 255, 0.1)'
    ctx.fillText(this.score[1], (constants.width * 3) / 4, y)
    // ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'

    // ctx.fillRect(0, 0, constants.width, constants.height)
    ctx.restore()
  }
}
