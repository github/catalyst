/**
 * A utility method which wraps a prototype method, ensuring the given function
 * is also called as part of the given method name.
 *
 * Used in the `controller()` decorator.
 */
export function wrap(obj: any, name: string, fn: (...args: any[]) => any) {
  if (!obj.prototype[name]) {
    obj.prototype[name] = fn
  } else {
    const oldFn = obj.prototype[name]
    obj.prototype[name] = function (...args: unknown[]) {
      fn.apply(this, args)
      oldFn.apply(this, args)
    }
  }
}
