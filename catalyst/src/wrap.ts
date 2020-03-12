export function wrap(obj: any, name: string, fn: (...args: any[]) => any) {
  if (!obj[name]) {
    obj[name] = fn
  } else {
    const oldFn = obj[name]
    obj[name] = function () {
      oldFn.call(this)
      fn.call(this, this)
    }
  }
}
