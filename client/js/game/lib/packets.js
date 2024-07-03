/**
 * @enum {number}
 */
export const PacketType = {
  PublishButtons: 0,
}

export class BytesBuffer {
  head = 0
  /**
   * @param {ArrayBuffer} buf
   */
  constructor(buf) {
    this.buf = new DataView(buf)
  }

  asBuffer() {
    return this.buf.buffer
  }

  /**
   * @private
   * @param {'Uint' | 'Int'} prefix
   * @param {number} num
   */
  makeReadFn(prefix, num) {
    return () => {
      const value = this.buf[`get${prefix}${num}`](this.head)
      this.head += num >> 3
      return value
    }
  }

  readUint8 = this.makeReadFn('Uint', 8)
  readUint16 = this.makeReadFn('Uint', 16)
  readUint32 = this.makeReadFn('Uint', 32)

  /**
   * @private
   * @param {'Uint' | 'Int'} prefix
   * @param {number} num
   */
  makeWriteFn(prefix, num) {
    return (value) => {
      this.buf[`set${prefix}${num}`](this.head, value)
      this.head += num >> 3
      return this
    }
  }

  writeUint8 = this.makeWriteFn('Uint', 8)
  writeUint16 = this.makeWriteFn('Uint', 16)
  writeUint32 = this.makeWriteFn('Uint', 32)

  seek(offset) {
    this.head = offset
    return this
  }
}

export class BasePacket {
  /**
   *
   * @param {PacketType} type
   * @param {number} idx
   * @param {number} tick
   */
  constructor(type, idx, tick) {
    this.type = type
    this.idx = idx
    this.tick = tick
  }

  /**
   * @protected
   * @param {number} extraBytes
   */
  withHeader(extraBytes = 0) {
    return new BytesBuffer(new ArrayBuffer(9 + extraBytes))
      .writeUint8(this.type)
      .writeUint32(this.idx)
      .writeUint32(this.tick)
  }

  /**
   * @protected
   */
  asBytes() {
    return this.withHeader()
  }

  /**
   * Marshal the packet to an ArrayBuffer
   * @returns {ArrayBuffer}
   */
  marshal() {
    return this.asBytes().asBuffer()
  }

  /** @type {Record<PacketType, typeof BasePacket>} */
  static packetTypeMap = {}
  /**
   * @protected
   * @param {PacketType} type
   * @param {typeof BasePacket} packetClass
   */
  static registerPacketType(type, packetClass) {
    if (this.packetTypeMap[type])
      throw new Error(`Duplicate packet type: ${type}`)

    this.packetTypeMap[type] = packetClass
  }

  /**
   * Parse the given ArrayBuffer into a packet
   * @param {ArrayBuffer} buf
   * @returns {BasePacket}
   */
  static unmarshal(buf) {
    const reader = new BytesBuffer(buf)
    const type = reader.readUint8()
    const idx = reader.readUint32()
    const tick = reader.readUint32()

    const base = new this(type, idx, tick)
    return this.packetTypeMap[type].fromBytes(base, reader)
  }

  /**
   * To be overridden by subclasses. Parse the rest of the bytes into a concrete
   * packet.
   * @param {BasePacket} base
   * @param {BytesBuffer} reader
   */
  static fromBytes(base, reader) {
    return base
  }

  /**
   * @template T
   * @param {T} Target
   * @returns {InstanceType<T> | undefined}
   */
  downcast(Target) {
    if (this instanceof Target) {
      return this
    }
    return undefined
  }
}

export class PublishButtonsPacket extends BasePacket {
  static {
    this.registerPacketType(PacketType.PublishButtons, this)
  }
  /**
   * @param {number} idx
   * @param {number} tick
   * @param {number} playerIdx
   * @param {number} buttons
   */
  constructor(idx, tick, playerIdx, buttons) {
    super(PacketType.PublishButtons, idx, tick)
    this.playerIdx = playerIdx
    this.buttons = buttons
  }

  /** @type {(typeof BasePacket)['asBytes']} */
  asBytes() {
    return super
      .withHeader(2)
      .writeUint8(this.playerIdx)
      .writeUint8(this.buttons)
  }

  /** @type {(typeof BasePacket)['fromBytes']} */
  static fromBytes(base, reader) {
    return new PublishButtonsPacket(
      base.idx,
      base.tick,
      reader.readUint8(),
      reader.readUint8()
    )
  }
}
