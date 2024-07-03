import { BasePacket } from './packets.js'

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

/**
 * Binary-sorted array to track packets in the correct order.
 * @extends {Array<BasePacket>}
 */
export class PacketQueue extends Array {
  /** The tick at which the history is no longer up to date */
  damagedTick = 0

  /**
   * Insert the packet into the right timestep in the queue.
   * @param {BasePacket} packet
   */
  push(packet) {
    let min = 0
    let max = this.length
    let i = min + (((max - min) / 2) << 0)
    let current = this[i]
    while (min < max) {
      if (
        current.tick < packet.tick ||
        (current.tick === packet.tick && current.idx < packet.idx)
      ) {
        min = i + 1
      } else if (
        current.tick > packet.tick ||
        (current.tick === packet.tick && current.idx > packet.idx)
      ) {
        max = i
      } else {
        break
      }
      i = min + (((max - min) / 2) << 0)
      current = this[i]
    }
    this.splice(i, 0, packet)
    this.damagedTick = Math.min(this.damagedTick, packet.tick)
  }

  /**
   * Update the damaged tick to the latest timestep.
   */
  resetDamage(tick) {
    this.damagedTick = tick
  }

  getDamagedSlice() {
    return this.slice(this.from(this.damagedTick))
  }

  /**
   * Return the index of the first packet at the given tick.
   * Reverse traversal because that's the direction with less travel.
   * @param {number} tick
   */
  from(tick) {
    let i
    for (i = this.length - 1; i >= 0; i--) {
      if (this[i].tick < tick) break
    }

    return i + 1
  }
}
