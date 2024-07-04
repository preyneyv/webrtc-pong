/** @typedef {import('../manager.js').GameConfig} GameConfig */
import htm from 'https://esm.sh/htm'
import { h, render } from 'https://esm.sh/preact'
import { useEffect, useState } from 'https://esm.sh/preact/hooks'

const html = htm.bind(h)

import { defaultGameConfig } from '../manager.js'
import Scene from '../scene.js'

function SOCDSelector({ value, setValue }) {
  return html`<label>
    <span>Vertical SOCD</span>
    <select value=${value} onInput=${(e) => setValue(e.target.value)}>
      <option value="lastInput">Last Input</option>
      <option value="neutral">Neutral</option>
      <option value="absolutePositive">Prefer Up</option>
      <option value="absoluteNegative">Prefer Down</option>
    </select>
  </label>`
}

function KeyboardControllerSettings({ settings, setSettings }) {
  return html`<div>
    <${SOCDSelector}
      value=${settings.socdVertical}
      setValue=${(socdVertical) => setSettings({ ...settings, socdVertical })}
    />
    <h3>Keybinds</h3>
    <div class="keybind-grid">
      ${['Up', 'Down'].map((control) => {
        const key = settings.keybinds[control]
        let value = key
        if (key.startsWith('Key')) {
          value = 'Key ' + key.slice(3)
        } else if (key.startsWith('Arrow')) {
          value = key.slice(5) + ' Arrow'
        } else if (key.startsWith('Digit')) {
          value = 'Digit ' + key.slice(5)
        }
        return html` <div>${control}</div>
          <div>
            <input
              type="text"
              value=${value}
              onKeydown=${(e) => {
                e.preventDefault()
                setSettings({
                  ...settings,
                  keybinds: {
                    ...settings.keybinds,
                    [control]: e.code,
                  },
                })
              }}
            />
          </div>`
      })}
    </div>
  </div>`
}

function GamepadControllerSettings({ settings, setSettings }) {
  const [gamepads, setGamepads] = useState([])
  function refetchGamepads() {
    const gamepads = navigator.getGamepads()
    setGamepads(gamepads.filter((gamepad) => gamepad !== null))
  }
  useEffect(() => {
    refetchGamepads()
    window.addEventListener('gamepadconnected', refetchGamepads)
    window.addEventListener('gamepaddisconnected', refetchGamepads)
    return () => {
      window.removeEventListener('gamepadconnected', refetchGamepads)
      window.removeEventListener('gamepaddisconnected', refetchGamepads)
    }
  }, [])

  return html`<div>
    <${SOCDSelector}
      value=${settings.socdVertical}
      setValue=${(socdVertical) => setSettings({ ...settings, socdVertical })}
    />
    <label>
      <span>Active Gamepad</span>
      <select
        value=${settings.gamepadIdx}
        onFocus=${() => refetchGamepads()}
        onInput=${(e) =>
          setSettings({ ...settings, gamepadIdx: +e.target.value })}
      >
        <option value="-1">None</option>
        ${gamepads.map(
          (gamepad) =>
            html`<option value=${gamepad.index}>${gamepad.id}</option>`
        )}
      </select>
    </label>
  </div>`
}

function PlayerConfig({ player, setPlayer, label }) {
  return html`<div class="player-config">
    <h2>${label}</h2>
    <label>
      <span>Username</span>
      <input
        type="text"
        value=${player.username}
        onInput=${(e) => setPlayer({ ...player, username: e.target.value })}
      />
    </label>
    <label>
      <span>Controller</span>
      <select
        value=${player.controller}
        onInput=${(e) => setPlayer({ ...player, controller: e.target.value })}
      >
        <option value="keyboard">Keyboard</option>
        <option value="gamepad">Gamepad</option>
      </select>
    </label>
    <details class="controller-settings" open>
      <summary>Controller Settings</summary>
      ${player.controller === 'keyboard' &&
      html`<${KeyboardControllerSettings}
        settings=${player.controllerSettings.keyboard}
        setSettings=${(keyboard) =>
          setPlayer({
            ...player,
            controllerSettings: { ...player.controllerSettings, keyboard },
          })}
      />`}
      ${player.controller === 'gamepad' &&
      html`<${GamepadControllerSettings}
        settings=${player.controllerSettings.gamepad}
        setSettings=${(gamepad) =>
          setPlayer({
            ...player,
            controllerSettings: { ...player.controllerSettings, gamepad },
          })}
      />`}
    </details>
  </div>`
}

function NumaRange({ value, setValue, min, max, step }) {
  return html`<div class="numarange">
    <input
      type="range"
      min=${min}
      max=${max}
      step=${step}
      value=${value}
      onInput=${(e) => setValue(+e.target.value)}
    />
    <input
      type="number"
      min=${min}
      max=${max}
      step=${step}
      value=${value}
      onInput=${(e) => setValue(+e.target.value)}
    />
  </div>`
}

function TransportSettings({ settings, setSettings }) {
  return html`<div>
    <details>
      <summary>Transport Settings</summary>
      <label>
        <span>Absolute Delay</span>
        <${NumaRange}
          value=${settings.absoluteDelay}
          setValue=${(absoluteDelay) =>
            setSettings({ ...settings, absoluteDelay })}
          min=${0}
          max=${1000}
          step=${10}
        />
      </label>
      <label>
        <span>Jitter Delay</span>
        <${NumaRange}
          value=${settings.jitterDelay}
          setValue=${(jitterDelay) => setSettings({ ...settings, jitterDelay })}
          min=${0}
          max=${1000}
          step=${10}
        />
      </label>
    </details>
  </div>`
}

function ConfigScreen({ onStart }) {
  /** @type {[GameConfig, (cfg: GameConfig) => void]} */
  const [config, setConfig] = useState(defaultGameConfig)
  const { gameMode, transport, player0, player1 } = config

  function startButtonClicked() {
    const squishedCfg = {
      gameMode,
      transport,
      player0: {
        ...player0,
        controllerSettings: player0.controllerSettings[player0.controller],
      },
      player1:
        gameMode === 'local'
          ? {
              ...player1,
              controllerSettings:
                player1.controllerSettings[player1.controller],
            }
          : null,
    }

    // TODO: validate config before starting
    onStart(squishedCfg)
  }
  return html`<section>
    <header>
      <h1>P2Pong</h1>

      <select
        class="game-mode"
        value=${gameMode}
        onInput=${(e) => setConfig({ ...config, gameMode: e.target.value })}
      >
        <option value="online">Online</option>
        <option value="local">Local</option>
      </select>
    </header>
    <div class="player-config-grid">
      <${PlayerConfig}
        player=${player0}
        setPlayer=${(player0) => setConfig({ ...config, player0 })}
        label=${gameMode === 'local' ? 'Player 1' : 'Player Settings'}
      />
      ${gameMode === 'local' &&
      html`<${PlayerConfig}
        player=${player1}
        setPlayer=${(player1) => setConfig({ ...config, player1 })}
        label="Player 2"
      />`}
    </div>

    ${gameMode === 'online' &&
    html`<${TransportSettings}
      settings=${transport}
      setSettings=${(transport) => setConfig({ ...config, transport })}
    />`}

    <button onClick=${startButtonClicked} class="start-button">
      ${gameMode === 'local' ? 'Start Game' : 'Join Queue'}
    </button>
  </section>`
}

export default class ConfigScene extends Scene {
  constructor(selector, onStart) {
    super(selector)
    render(html`<${ConfigScreen} onStart=${onStart} />`, this.el)
  }
}
