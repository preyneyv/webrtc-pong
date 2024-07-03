const NOW = Symbol('now')
export default class AnimationController {
  active = {}
  nextId = 0

  constructor() {}

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} tick
   */
  render(ctx, tick) {
    for (const [id, animation] of Object.entries(this.active)) {
      if (animation.isComplete(tick)) {
        delete this.active[id]
      } else {
        animation.render(ctx, tick)
      }
    }
  }

  /**
   *
   * @param {number} duration
   * @param {(ctx: CanvasRenderingContext2D, t: number) => void} callback
   * @param {{ start?: number, easing?: number }} extraParams
   * @returns
   */
  add(duration, callback, { start = NOW, easing = Easing.linear } = {}) {
    const id = this.nextId++
    this.active[id] = new Animation(id, duration, callback, start, easing)
    return id
  }

  /**
   * Cancel all existing animations that start after the given tick.
   * @param {number} tick
   */
  clear(tick) {
    for (const [id, animation] of Object.entries(this.active)) {
      if (animation.start === NOW || animation.start > tick) {
        delete this.active[id]
      }
    }
  }
}

export const Easing = {
  linear: (start, end, t) =>
    Math.min(1, Math.max(0, (t - start) / (end - start))),
}

export class Animation {
  /**
   * @param {number | typeof NOW} start
   * @param {number} duration
   * @param {(ctx: CanvasRenderingContext2D, t: number) => void} callback
   * @param {(start: number, end: number, t: number) => number} easing
   */
  constructor(id, duration, callback, start = NOW, easing = Easing.linear) {
    this.start = start
    this.duration = duration
    this.callback = callback
    this.easing = easing
  }

  isComplete(tick) {
    return this.start !== NOW && tick >= this.start + this.duration
  }

  render(ctx, tick) {
    if (this.start === NOW) this.start = tick
    this.callback(
      ctx,
      this.easing(this.start, this.start + this.duration, tick)
    )
  }
}
