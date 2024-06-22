const express = require('express')
const path = require('path')
const http = require('http')
const sio = require('socket.io')

const PORT = +(process.env.PORT || 4545)

const app = express()
const server = http.createServer(app)
const io = new sio.Server(server)

app.use(express.static(path.join(__dirname, 'client')))

const matchmakingQueue = {}

io.on('connection', (socket) => {
  const { username, sessionId } = socket.handshake.query
  console.log('connection acquired', sessionId)
  const nextAvailableId = Object.keys(matchmakingQueue)[0]
  if (nextAvailableId) {
    // match found.
    console.log('match found', sessionId, nextAvailableId)
    const { username: otherUsername, socket: otherSocket } =
      matchmakingQueue[nextAvailableId]
    delete matchmakingQueue[nextAvailableId]

    // bridge sockets for signalling
    socket.on('signal', (message) => otherSocket.emit('signal', message))
    otherSocket.on('signal', (message) => socket.emit('signal', message))

    // notify sockets
    socket.emit('match-found', {
      username: otherUsername,
      sessionId: nextAvailableId,
      role: 'caller',
    })
    otherSocket.emit('match-found', { username, sessionId, role: 'answerer' })
  } else {
    // join queue.
    console.log('waiting for match', sessionId)
    matchmakingQueue[sessionId] = { username, socket }
  }

  socket.on('disconnect', () => {
    delete matchmakingQueue[sessionId]
    console.log('lost session', sessionId)
  })
})

server.listen(PORT, () =>
  console.log(`Pong server listening at http://localhost:${PORT}`)
)
