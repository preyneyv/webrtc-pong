import { Ball } from './ball.js'
import constants from './constants.js'
import AnimationController from './lib/animations.js'
import EventEmitter from './lib/events.js'
import { BasePacket, PublishButtonsPacket } from './lib/packets.js'
import { PacketQueue, RingBuffer } from './lib/rollback.js'
import Paddle from './paddle.js'
import BaseController from './players/base.js'
import BaseTransport from './transport/base.js'

export class Player {
  /**
   *
   * @param {string | null | undefined} username
   * @param {BaseController | undefined} controller
   */
  constructor(username, controller) {
    this.username = username
    this.controller = controller
    this.score = 0
  }

  bindToGame(game, playerIdx) {
    if (this.game)
      throw new Error('Cannot bind to game: already bound to another.')
    this.game = game
    this.playerIdx = playerIdx
    this.username = this.username || `Player ${playerIdx + 1}`
    this.isLeft = playerIdx === 0
    this.x = this.isLeft ? constants.width / 4 : (constants.width * 3) / 4
    this.controller?.bindToGame(game, playerIdx)
  }

  freeze() {
    return this.score
  }

  restoreState(state) {
    this.score = state
  }

  render(ctx, highlight) {
    const size = 240
    const y = constants.height / 2 + size * 0.08
    ctx.save()
    ctx.globalAlpha = highlight ? 0.2 : 0.1
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'white'

    ctx.font = `${size}px "Space Grotesk", sans-serif`
    ctx.fillText(this.score, this.x, y)

    ctx.font = '32px "Space Grotesk", sans-serif'
    ctx.fillText(this.username.slice(0, 16), this.x, y + size / 2)
    ctx.restore()
  }

  recordScore() {
    this.score++

    this.game.anim.add(100, (ctx, t) => {
      ctx.save()

      const grad = ctx.createLinearGradient(
        this.isLeft ? 0 : constants.width,
        0,
        this.isLeft ? constants.width : 0,
        0
      )
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.1)')
      grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.07)')
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)')

      ctx.globalAlpha = 1 - t
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, constants.width, constants.height)

      ctx.font = '36px "Space Grotesk", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'white'
      ctx.fillText('GOAL!', this.x, constants.height / 2 - 130 - t * 30)
      ctx.restore()
    })
    console.log('Score:', this.score)
  }
}

export default class GameInstance extends EventEmitter {
  tick = 0
  score = [0, 0]
  anim = new AnimationController(this)

  packetQueue = new PacketQueue()
  rollbackStateBuffer = new RingBuffer(constants.rollbackBufferSize)

  /**
   * @param {BaseTransport} transport
   * @param {[Player, Player]} players
   * @param {HTMLCanvasElement} canvasEl
   * @param {boolean} isHost
   */
  constructor(transport, players, canvasEl, isHost) {
    super()
    this.render = this.render.bind(this)

    this.isHost = isHost
    this.transport = transport
    transport.bindToGame(this)

    this.players = players
    players.map((player, i) => player.bindToGame(this, i))

    this.ball = new Ball(this)
    this.paddles = [new Paddle(this, 0), new Paddle(this, 1)]

    this.canvasEl = canvasEl
    canvasEl.width = constants.width
    canvasEl.height = constants.height
    this.ctx = canvasEl.getContext('2d')

    this.startedAt = performance.now()
    requestAnimationFrame(this.render)
  }

  recordScore(playerIdx) {
    this.players[playerIdx].recordScore()
  }

  freeze() {
    return [
      this.tick,
      this.players[0].freeze(),
      this.players[1].freeze(),
      this.paddles[0].freeze(),
      this.paddles[1].freeze(),
      this.ball.freeze(),
    ]
  }

  /**
   * Rewind to the given state.
   * @param {*} state target state
   */
  restoreState(state) {
    const [tick, player0, player1, paddle0, paddle1, ball] = state
    this.tick = tick
    this.players[0].restoreState(player0)
    this.players[1].restoreState(player1)
    this.paddles[0].restoreState(paddle0)
    this.paddles[1].restoreState(paddle1)
    this.ball.restoreState(ball)
  }

  /**
   * Add the packet to the rollback queue for processing at the next tick
   * @param {BasePacket} packet
   */
  enqueuePacket(packet) {
    this.packetQueue.push(packet)
  }

  /**
   *
   * Handle the packet at the current tick.
   * @param {BasePacket} packet
   */
  processPacket(packet) {
    if (packet instanceof PublishButtonsPacket) {
      this.paddles[packet.playerIdx].setButtonState(packet.buttons)
    }
  }

  /**
   * @param {DOMHighResTimeStamp} pts
   */
  render(pts) {
    const currentTick = this.tick
    const packetQueue = this.packetQueue.getDamagedSlice()

    if (packetQueue.length) {
      const earliestTick = packetQueue[0].tick
      const delta = currentTick - earliestTick

      if (earliestTick < currentTick) {
        // initiate a rollback
        console.log('rolling back', earliestTick, currentTick)
        this.anim.clear(earliestTick)

        // rewind to right before target tick
        const targetState = this.rollbackStateBuffer.retrieve(delta + 1)
        if (!targetState) {
          // TODO: implement state synchronization from host to client
          console.error('No rollback state for', earliestTick)
          return
        }
        this.restoreState(targetState, true)
      }
    }
    const elapsed = pts - this.startedAt
    const endTick = Math.floor((elapsed * constants.tickRate) / 1000)

    /**
     * Index of next packet to process -- shortcut for linear scan
     * m = endTick - startTick
     * n = packetQueue.length
     * O(mn) => O(n)
     */
    let processedIdx = 0
    while (this.tick < endTick) {
      const isTimeTravelling = this.tick < currentTick
      const stateBufferOffset = currentTick - this.tick

      // process packets at the right timestep
      while (processedIdx < packetQueue.length) {
        const packet = packetQueue[processedIdx]
        if (packet.tick < this.tick) {
          console.error('Too late for packet', packet, this.tick)
          throw new Error('Too late for packet.')
        }
        if (packet.tick > this.tick) break // we're now up-to-date until the "present"

        this.processPacket(packet)
        processedIdx++
      }

      // do physics
      this.paddles[0].tick()
      this.paddles[1].tick()
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

    this.packetQueue.resetDamage(this.tick)
    // re-add unprocessed packets to buffer
    // this.packetQueue.push(...packetQueue.slice(processedIdx))

    const { ctx } = this
    ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height)
    this.players[0].render(ctx, this.players[0].score > this.players[1].score)
    this.players[1].render(ctx, this.players[1].score > this.players[0].score)
    this.anim.render(ctx, this.tick)
    this.ball.render(ctx)
    this.paddles[0].render(ctx)
    this.paddles[1].render(ctx)

    requestAnimationFrame(this.render)
  }
}
