/**
 * A utility method which wraps a prototype method, ensuring the given function
 * is also called as part of the given method name.
 *
 * Used in the `controller()` decorator.
 */
export function wrap(obj: any, name: string, fn: (...args: any[]) => any) {
  if (!obj[name]) {
    obj[name] = fn
  } else {
    const oldFn = obj[name]
    obj[name] = function (...args: unknown[]) {
      fn.apply(this, args)
      oldFn.apply(this, args)
    }
  }
}
