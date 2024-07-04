import BaseTransport from './base.js'

/**
 * Dummy transport (intended for local-only games)
 */
export default class LoopbackTransport extends BaseTransport {
  send(data) {}
}
