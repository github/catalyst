import {dasherize} from './dasherize'
import {wrap} from './wrap'
import {getMethods} from './getmethods'

/**
 * Bind `[data-action]` elements from the DOM to their actions.
 */
export function bindEvents(classObject: any) {
  wrap(classObject.prototype, 'connectedCallback', function (this: HTMLElement) {
    for(const el of this.querySelectorAll(`[data-action*=":${this.tagName.toLowerCase()}#"]`)) {
      // Ignore nested elements
      if (el.closest(this.tagName) !== this) continue

      // Match the pattern of `eventName:constructor#method`.
      for(const binding of (el.getAttribute('data-action')||'').split(' ')) {
        const [rest, method] = binding.split('#')
        const [eventName, handler] = rest.split(':')
        if (handler !== this.tagName.toLowerCase()) continue

        // Check the `method` is present on the prototype
        const methodDescriptor = Object.getOwnPropertyDescriptor(classObject.prototype, method)
        if (methodDescriptor && typeof methodDescriptor.value == 'function') {
          el.addEventListener(eventName, (event: Event) => {
            if (event.target === el) (this as any)[method](event)
          })
        }

      }
    }
  })
}
