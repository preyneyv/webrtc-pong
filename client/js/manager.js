/** @typedef {import('./game/players/keyboard.js').KeyboardControllerConfig} KeyboardControllerConfig */
/** @typedef {import('./game/players/gamepad.js').GamepadControllerConfig} GamepadControllerConfig */
/** @typedef {import('./game/transport/base.js').BaseTransportConfig} BaseTransportConfig */

import GameInstance, { Player } from './game/game.js'
import { GamepadController } from './game/players/gamepad.js'
import { KeyboardController } from './game/players/keyboard.js'
import DataChannelTransport from './game/transport/datachannel.js'
import LoopbackTransport from './game/transport/loopback.js'
import { $ } from './lib/utils.js'
import NegotiatedPeerConnection from './negotiation.js'

/** @typedef {{
 *    username: string,
 *  } & (
 *    { controller: 'keyboard', controllerSettings: KeyboardControllerConfig } |
 *    { controller: 'gamepad', controllerSettings: GamepadControllerConfig }
 *  )} PlayerConfig */

/** @typedef {{
 *    gameMode: 'local' | 'online',
 *    player0: PlayerConfig,
 *    player1: PlayerConfig,
 *    transport: BaseTransportConfig
 *  }} GameConfig */

/** @type {PlayerConfig} */
export const defaultPlayer = {
  username: '',
  controller: 'keyboard',
  controllerSettings: {
    keyboard: {
      socdVertical: 'lastInput',
      keybinds: { Up: 'ArrowUp', Down: 'ArrowDown' },
    },
    gamepad: {
      socdVertical: 'lastInput',
      gamepadIdx: -1,
    },
  },
}

/** @type {GameConfig} */
export const defaultGameConfig = {
  gameMode: 'online',
  player0: defaultPlayer,
  player1: defaultPlayer,
  transport: {
    absoluteDelay: 0,
    jitterDelay: 0,
  },
}

export default class GameManager {
  constructor(changeScene) {
    this.changeScene = changeScene
  }

  /**
   * @param {PlayerConfig} playerConfig
   */
  makeController(playerConfig) {
    if (playerConfig.controller === 'keyboard') {
      return new KeyboardController(playerConfig.controllerSettings)
    } else if (playerConfig.controller === 'gamepad') {
      return new GamepadController(playerConfig.controllerSettings)
    } else {
      throw new Error(`Unsupported controller: ${playerConfig.controller}`)
    }
  }

  /**
   * @param {GameConfig} config
   */
  beginWithConfig(config) {
    if (config.gameMode === 'local') {
      this.beginLocal(config)
    } else {
      this.beginOnline(config)
    }
  }

  /**
   * @param {GameConfig} config
   */
  beginLocal(config) {
    $('#connection-status').style.display = 'none'
    const transport = new LoopbackTransport(config.transport)
    const players = [
      new Player(config.player0.username, this.makeController(config.player0)),
      new Player(config.player1.username, this.makeController(config.player1)),
    ]

    new GameInstance(transport, players, $('#game-board'), true)
    this.changeScene('game')
  }

  /**
   * @param {GameConfig} config
   */
  async beginOnline(config) {
    $('#connection-status').style.display = 'block'
    this.changeScene('inQueue')
    const negotiator = new NegotiatedPeerConnection({
      username: config.player0.username,
    })
    const spec = await negotiator.ready.flag

    negotiator.connectionState.subscribe((state) => {
      $('#connection-status').textContent =
        state[0].toUpperCase() + state.slice(1)
    })

    const isHost = spec.role === 'caller'
    const transport = new DataChannelTransport(
      negotiator.channel,
      config.transport
    )
    const players = [
      new Player(config.player0.username, this.makeController(config.player0)),
      new Player(spec.username),
    ]
    if (!isHost) players.reverse()

    new GameInstance(transport, players, $('#game-board'), isHost)
    this.changeScene('game')
  }
}
