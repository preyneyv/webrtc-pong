# WebRTC Pong

https://github.com/user-attachments/assets/46ccd8b3-cf31-4719-b598-91e47425b115

A multiplayer pong game using WebRTC. Used as a sandbox for learning about
WebRTC and rollback netcode.

This code is no-build JavaScript, so code is annotated with JSDoc.

## Getting Started

```sh
# Install dependencies
npm install

# Start the server
npm start
```

Open [`http://localhost:4545`](http://localhost:4545) in two browsers and click
"Join Queue".

## WebRTC

The matchmaking server is implemented in the simplest possible way: as soon as
two players join the queue, they are matched together. Obviously, this is not
great matchmaking experience, but it serves the purpose of acting as a signaller
for the WebRTC connection.

Packets are transmitted over an unordered `RTCDataChannel` to minimize latency.

## Rollback Netcode

Because this game is peer-to-peer (no source of truth) and there is variable
latency between players, we need to implement latency compensation. This game
uses rollback netcode (basically time-travel).

Possibly the greatest explanation of this sorcery is this website: [https://bymuno.com/post/rollback](https://bymuno.com/post/rollback)

In summary:

- Timestamp every outgoing packet
- Store game state in a ring buffer (keyed by timestamp)
- Send a packet whenever a local button is pressed
- When a packet is received:
  - Rewind game state to the timestamp of the packet
  - Apply the input from the packet
  - Fast forward to the present time (replaying all local inputs in that duration)

Things like state retransmission and interpolation are not implemented.
