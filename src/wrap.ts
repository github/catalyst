/**
 * A utility method which wraps a method on an object. If the method doesn't
 * already exist on the object, it is simply assigned. If it does exist then
 * both the new function and the existing function will be called with the same
 * arguments.
 *
 * Used in the `controller()` decorator.
 */
export function wrap<K extends string>(
  obj: Record<K, ((...args: unknown[]) => void) | undefined>,
  name: K,
  fn: (...args: unknown[]) => unknown
): void {
  const oldFn = obj[name]
  if (!oldFn) {
    obj[name] = fn
  } else {
    obj[name] = function (...args: unknown[]) {
      fn.apply(this, args)
      oldFn.apply(this, args)
    }
  }
}
