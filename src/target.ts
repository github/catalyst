import {findTarget, findTargets} from './findtarget.js'

/**
 * Target is a decorator which - when assigned to a property field on the
 * class - will override that class field, turning it into a Getter which
 * returns a call to `findTarget(this, key)` where `key` is the name of the
 * property field. In other words, `@target foo` becomes a getter for
 * `findTarget(this, 'foo')`.
 */
export function target<K extends string>(proto: Record<K, unknown>, key: K): void {
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      return findTarget(this, key)
    }
  })
}

/**
 * Targets is a decorator which - when assigned to a property field on the
 * class - will override that class field, turning it into a Getter which
 * returns a call to `findTargets(this, key)` where `key` is the name of the
 * property field. In other words, `@targets foo` becomes a getter for
 * `findTargets(this, 'foo')`.
 */
export function targets<K extends string>(proto: Record<K, unknown>, key: K): void {
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      return findTargets(this, key)
    }
  })
}
