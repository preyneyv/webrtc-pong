import { PADDLE_MASKS } from '../paddle.js'
import BaseController from './base.js'

const GAMEPAD_DEADZONE = 0.1

/** @typedef {Partial<import("./base").BaseControllerConfig & {
 *   gamepadIdx: number
 * }} GamepadControllerConfig */

/**
 * A Controller that binds to gamepad events.
 */
export class GamepadController extends BaseController {
  isRunning = true

  /**
   * @param {GamepadControllerConfig} config
   */
  constructor({ gamepadIdx, socdVertical } = {}) {
    super({ socdVertical })
    this.gamepadIdx = gamepadIdx
    requestAnimationFrame(this.pollGamepad.bind(this))
  }

  buttonPressed(button) {
    return button.pressed || button.value > 0.5
  }

  pollGamepad() {
    const { gamepadIdx } = this

    if (!this.isRunning) return

    /** @type {Gamepad} */
    const gamepad = navigator.getGamepads()[gamepadIdx]

    if (!gamepad) {
      console.warn(`Gamepad with index ${gamepadIdx} not found.`)
      return setTimeout(this.pollGamepad.bind(this), 1000)
    }

    if (gamepad.mapping !== 'standard') {
      console.warn(
        'Unsupported gamepad mapping encountered. Only standard mapping is supported.'
      )
      return setTimeout(this.pollGamepad.bind(this), 1000)
    }

    let buttons = 0

    // Refer to https://w3c.github.io/gamepad/#remapping for standard mapping
    if (this.buttonPressed(gamepad.buttons[3])) buttons |= PADDLE_MASKS.Up
    if (this.buttonPressed(gamepad.buttons[0])) buttons |= PADDLE_MASKS.Down

    if (this.buttonPressed(gamepad.buttons[12])) buttons |= PADDLE_MASKS.Up
    if (this.buttonPressed(gamepad.buttons[13])) buttons |= PADDLE_MASKS.Down

    if (gamepad.axes[1] < -GAMEPAD_DEADZONE) buttons |= PADDLE_MASKS.Up
    if (gamepad.axes[1] > GAMEPAD_DEADZONE) buttons |= PADDLE_MASKS.Down

    if (gamepad.axes[3] < -GAMEPAD_DEADZONE) buttons |= PADDLE_MASKS.Up
    if (gamepad.axes[3] > GAMEPAD_DEADZONE) buttons |= PADDLE_MASKS.Down

    this.processRawButtons(buttons)

    requestAnimationFrame(this.pollGamepad.bind(this))
  }

  destroy() {
    this.isRunning = false
  }
}
