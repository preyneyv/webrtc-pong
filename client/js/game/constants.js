const constants = {
  width: 1280,
  height: 720,

  tickRate: 128,
  rollbackBufferSize: 128 * 5, // 5 seconds of rollbackability
  inputDelay: 3, // = 3 * 1000 / 128 = 23ms

  paddleHeight: 120,
  paddleWidth: 16,
  paddleSpeed: 4,

  ballRadius: 10,
  ballSpeed: 6,
}
export default constants
