export class SOCDCleaner {
  /**
   * @abstract
   * @param {boolean} positive whether the positive direction is pressed
   * @param {boolean} negative whether the negative direction is pressed
   * @returns {-1 | 0 | 1} the cleaned direction to output
   */
  clean(positive, negative) {
    throw new Error('not implemented')
  }
}

/**
 * Prioritize the most recent input.
 */
export class LastInputPrioritySOCDCleaner extends SOCDCleaner {
  lastDirection = 0

  /** @type {SOCDCleaner['clean']} */
  clean(positive, negative) {
    if (positive && negative) {
      return -this.lastDirection
    } else if (positive) {
      this.lastDirection = 1
      return 1
    } else if (negative) {
      this.lastDirection = -1
      return -1
    } else {
      this.lastDirection = 0
      return 0
    }
  }
}

export class AbsoluteSOCDCleaner extends SOCDCleaner {
  /**
   * @param {-1 | 0 | 1} conflictDirection
   */
  constructor(conflictDirection) {
    super()
    this.conflictDirection = conflictDirection
  }

  clean(positive, negative) {
    if (positive && negative) return this.conflictDirection
    else if (positive) return 1
    else if (negative) return -1
    return 0
  }
}

/** @typedef {'lastInput'
 *  | 'neutral'
 *  | 'absolutePositive'
 *  | 'absoluteNegative'
 * } SOCDCleanerType */

/**
 *
 * @param {SOCDCleanerType} type
 */
export default function getSOCDCleaner(type) {
  switch (type) {
    case 'lastInput':
      return new LastInputPrioritySOCDCleaner()
    case 'neutral':
      return new AbsoluteSOCDCleaner(0)
    case 'absoluteNegative':
      return new AbsoluteSOCDCleaner(-1)
    case 'absolutePositive':
      return new AbsoluteSOCDCleaner(1)
  }
}
