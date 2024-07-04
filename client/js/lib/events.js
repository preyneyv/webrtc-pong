export default class EventEmitter extends EventTarget {
  on(eventName, listener) {
    const callback = ({ detail }) => listener(detail)
    this.addEventListener(eventName, callback)
    return { destroy: () => this.off(eventName, callback) }
  }

  once(eventName, listener) {
    this.addEventListener(eventName, ({ detail }) => listener(detail), {
      once: true,
    })
  }

  emit(eventName, detail) {
    this.dispatchEvent(new CustomEvent(eventName, { detail }))
  }
}
