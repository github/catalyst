import {bind} from '@github/catalyst'

const wrap = (obj: any, name: string, fn: (...args: any[]) => any) => {
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

/**
 * Bind `[data-action]` elements from the DOM to their actions.
 */
export function bindEvents(classObject: Function) {
  wrap(classObject.prototype, 'connectedCallback', bind)
}
