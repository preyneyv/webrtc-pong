import '/socket.io/socket.io.js'

import Scene from './scene.js'
import { ICE_SERVERS } from './constants.js'
import GameInstance from './game/game.js'
import LocalPlayer from './game/players/local.js'
import RemotePlayer from './game/players/remote.js'

let socket
const sessionId = crypto.randomUUID()

const scenes = {
  joinForm: new Scene('#scene-join-form'),
  inQueue: new Scene('#scene-in-queue'),
  game: new Scene('#scene-game'),
}

scenes.joinForm.show()
scenes.joinForm.$('form').addEventListener('submit', (e) => {
  e.preventDefault()
  const username = scenes.joinForm.$('.username').value
  joinQueue(username)
})

joinQueue(sessionId)

function joinQueue(username) {
  console.log('self:', username, sessionId)

  scenes.joinForm.hide()
  scenes.inQueue.show()

  if (socket) {
    socket.off('disconnect')
    socket.disconnect()
  }

  socket = io({
    query: {
      username,
      sessionId,
    },
  })
  socket.on('disconnect', () => {
    window.location.reload()
  })

  socket.on('match-found', (spec) =>
    negotiatePeerConnection(spec.username, spec.sessionId, spec.role)
  )
}

async function negotiatePeerConnection(oppUsername, oppSessionId, role) {
  scenes.inQueue.hide()
  scenes.game.show()

  console.log('opponent:', oppUsername, oppSessionId)
  console.log('role:', role)
  const pc = new RTCPeerConnection({
    iceServers: ICE_SERVERS,
  })

  if (role === 'caller') {
    // [1] caller creates the offer
    pc.addEventListener('negotiationneeded', async () => {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket.emit('signal', { type: 'offer', offer })
    })
  }

  // [4] whenever local gets an ICE candidate, we tell remote about it
  pc.addEventListener('icecandidate', (event) => {
    socket.emit('signal', { type: 'candidate', candidate: event.candidate })
  })

  socket.on('signal', async (message) => {
    if (message.type === 'offer') {
      // [2] answerer receives the offer and responds with an answer
      if (role !== 'answerer')
        throw new Error('Received offer when not answerer.')

      await pc.setRemoteDescription(message.offer)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('signal', { type: 'answer', answer })
    } else if (message.type === 'answer') {
      // [3] caller receives the answer and establishes connections
      if (role !== 'caller') throw new Error('Received answer when not caller.')
      await pc.setRemoteDescription(message.answer)
    } else if (message.type === 'candidate') {
      // [4] whenever remote gets an ICE candidate, we update local with it
      pc.addIceCandidate(message.candidate)
    } else {
      console.error(message)
      throw new Error('Malformed message.')
    }
  })

  const dataChannel = pc.createDataChannel('transport', {
    negotiated: true,
    id: 1,
  })

  pc.addEventListener('connectionstatechange', () => {
    const { connectionState } = pc
    scenes.game.$('#connection-status').innerHTML =
      connectionState[0].toUpperCase() + connectionState.slice(1)
  })

  // dataChannel.addEventListener('message', ({ data }) => {
  //   console.log('dc', data)
  // })
  dataChannel.addEventListener('open', () => {
    console.log('p2p connection opened')
    const localPlayer = new LocalPlayer(dataChannel)
    const remotePlayer = new RemotePlayer(dataChannel)
    let player1 = role === 'caller' ? localPlayer : remotePlayer
    let player2 = role === 'caller' ? remotePlayer : localPlayer
    new GameInstance(player1, player2, scenes.game.$('#game-board'))
  })
}
