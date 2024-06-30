import BaseTransport from './base.js'

/**
 * Dummy transport (intended for local-only games)
 */
export default class DummyTransport extends BaseTransport {
  send(data) {
    console.log('DummyTransport sending:', data)
  }
}
