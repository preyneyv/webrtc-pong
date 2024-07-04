import '/socket.io/socket.io.js'

import { ICE_SERVERS } from './constants.js'
import GameInstance, { Player } from './game/game.js'
import { KeyboardController } from './game/players/keyboard.js'
import Scene from './scene.js'
import DataChannelTransport from './game/transport/datachannel.js'
import LoopbackTransport from './game/transport/loopback.js'
import ConfigScene from './scenes/config.js'
import GameManager from './manager.js'

let socket
const sessionId = crypto.randomUUID()

const gameManager = new GameManager((targetScene) => {
  Object.values(scenes).forEach((scene) => scene.hide())
  scenes[targetScene].show()
})

const scenes = {
  config: new ConfigScene('#scene-config', (config) => {
    console.log('starting with config', config)
    gameManager.beginWithConfig(config)
  }),
  inQueue: new Scene('#scene-in-queue'),
  game: new Scene('#scene-game'),
}
scenes.config.show()
