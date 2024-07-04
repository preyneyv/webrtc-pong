import '/socket.io/socket.io.js'

import EventEmitter from './lib/events.js'
import { ICE_SERVERS } from './constants.js'
import { Future, Stream } from './lib/streams.js'

export default class NegotiatedPeerConnection extends EventEmitter {
  /** @type {Future<{role: string, username: string, sessionId: string}} */
  ready = new Future()

  constructor({ username }) {
    super()
    this.sessionId = crypto.randomUUID()
    this.username = username
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    this.channel = this.pc.createDataChannel('transport', {
      negotiated: true,
      ordered: false,
      id: 1,
    })

    this.socket = io({
      query: {
        username: this.username,
        sessionId: this.sessionId,
      },
    })

    this.connectionState = new Stream(this.pc.connectionState)
    this.pc.addEventListener('connectionstatechange', () =>
      this.connectionState.next(this.pc.connectionState)
    )

    this.signalingState = new Stream(this.pc.signalingState)
    this.pc.addEventListener('signalingstatechange', () =>
      this.signalingState.next(this.pc.signalingState)
    )

    this.socket.on('disconnect', () => window.location.reload())
    this.socket.on('match-found', (spec) => this.onMatchFound(spec))
  }

  async onMatchFound({ username, sessionId, role }) {
    const { pc, channel } = this
    this.emit('state', 'connecting')
    console.log('self:', this.username, this.sessionId, role)
    console.log('opponent:', username, sessionId)

    if (role === 'caller') {
      // [1] caller creates the offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      this.socket.emit('signal', { type: 'offer', offer })
    }

    this.socket.on('signal', async (message) => {
      if (message.type === 'offer') {
        // [2] answerer receives the offer and responds with an answer
        if (role !== 'answerer')
          throw new Error('Received offer when not answerer')

        await pc.setRemoteDescription(message.offer)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        this.socket.emit('signal', { type: 'answer', answer })
      } else if (message.type === 'answer') {
        // [3] caller receives the answer and establishes a connection
        if (role !== 'caller')
          throw new Error('Received answer when not caller.')
        await pc.setRemoteDescription(message.answer)
      } else if (message.type === 'candidate') {
        // [bg] whenever remote gets an ICE candidate, we update local with it
        pc.addIceCandidate(message.candidate)
      } else {
        console.error(message)
        throw new Error('Malformed message.')
      }
    })

    // [bg] whenever local gets an ICE candidate, we tell remote about it
    pc.addEventListener('icecandidate', (event) =>
      this.socket.emit('signal', {
        type: 'candidate',
        candidate: event.candidate,
      })
    )

    pc.addEventListener('connectionstatechange', () => {
      if (pc.connectionState === 'connected') {
        this.socket.off('disconnect')
        this.socket.disconnect()
      }
    })

    channel.addEventListener('open', () => {
      this.ready.resolve({ role, username, sessionId })
    })
  }
}
