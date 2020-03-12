export function wrap(obj: any, name: string, fn: (...args: any[]) => any) {
  if (!obj.prototype[name]) {
    obj[name] = fn
  } else {
    const oldFn = obj.prototype[name]
    obj.prototype[name] = function () {
      oldFn.call(this)
      fn.call(this, this)
    }
  }
}
