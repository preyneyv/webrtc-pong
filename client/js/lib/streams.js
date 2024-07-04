/**
 * @template T
 */
export class Stream {
  observers = []

  /** @type {T} */
  lastValue

  /**
   * @param {T} value
   */
  constructor(value) {
    this.lastValue = value
  }

  /**
   * @param {(value: T) => void} listener
   */
  subscribe(listener) {
    listener(this.lastValue)
    this.observers.push(listener)
    return () => {
      this.observers = this.observers.filter((l) => l !== listener)
    }
  }

  /**
   * @param {T} value
   */
  next(value) {
    this.lastValue = value
    for (let callback of this.observers) {
      callback(value)
    }
  }
}

/**
 * @template T
 */
export class Future {
  /** @type {Promise<T>} */
  flag = new Promise((res, rej) => {
    this.resolve = res
    this.reject = rej
  })
}
