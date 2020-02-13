import {dasherize} from './dasherize'
import {wrap} from './wrap'
import {getMethods} from './getmethods'

/**
 * Bind `[data-action]` elements from the DOM to their actions.
 */
export function bindEvents(classObject: any) {
  const methods = getMethods(classObject.prototype)
  const name = dasherize(classObject.name)
  wrap(classObject.prototype, 'connectedCallback', function (this: HTMLElement) {
    const selectors = methods.map(method => `[data-action*=":${name}#${method}"]`).join(',')
    for(const el of this.querySelectorAll(selectors)) {
      // Match the pattern of `eventName:constructor#method`.
      for(const binding of (el.getAttribute('data-action')||'').split(' ')) {
        const [rest, method] = binding.split('#')
        const [eventName, handler] = rest.split(':')
        if (handler === name) {
          el.addEventListener(eventName, (event: Event) => {
            if (event.target === el) (this as any)[method](event)
          })
        }
      }
    }
  })
}
