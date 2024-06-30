export class RingBuffer {
  head = 0

  constructor(size) {
    this.size = size
    this.buffer = new Array(size)
  }

  push(item) {
    this.buffer[this.head] = item
    this.head = this.wrapped(this.head + 1)
  }

  wrapped(index) {
    if (index < 0) index = this.size + index
    return index % this.size
  }

  /**
   * Retrieve the nth past item, where n = 0 gives you the latest
   */
  retrieve(n) {
    if (n > this.size) return undefined
    const target = this.wrapped(this.head - n)
    return this.buffer[target]
  }

  /** Set the nth past item, where n = 0 sets the latest */
  set(n, item) {
    if (n > this.size) return
    const target = this.wrapped(this.head - n)
    this.buffer[target] = item
  }
}

/**
 * Buffer that appends to one buffer while reading from the other.
 * @template T
 */
export class BackBuffer {
  /** @type {T[]} */
  front = []
  /** @type {T[]} */
  back = []

  /**
   * @param  {...T} items
   */
  push(...items) {
    this.back.push(...items)
  }

  /**
   * Clear the front buffer
   * Swap the front and back buffers
   * @returns {T[]}
   */
  swap() {
    this.front.length = 0
    ;[this.front, this.back] = [this.back, this.front]
    return this.front
  }
}
