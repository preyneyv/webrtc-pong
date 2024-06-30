export default class EventEmitter extends EventTarget {
  on(eventName, listener) {
    this.addEventListener(eventName, ({ detail }) => listener(detail))
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
