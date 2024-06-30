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

export class BackBuffer {
  front = []
  back = []
  push(...items) {
    this.back.push(...items)
  }

  swap() {
    ;[this.front, this.back] = [this.back, this.front]
    this.back.length = 0
    return this.front
  }
}
