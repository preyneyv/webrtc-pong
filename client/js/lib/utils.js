/**
 * @param {string} selector
 * @returns {Element}
 */
export const $ = (selector) => document.querySelector(selector)

/**
 * Set `mask`ed bits in the given `source` according to `value`.
 * @param {number} source
 * @param {number} mask
 * @param {boolean} value
 */
export const setBit = (source, mask, value) => {
  if (value) return source | mask
  else return source & ~mask
}
