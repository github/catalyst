/*
 * Bind `[data-action]` elements from the DOM to their actions.
 *
 */
export function bind(controller: HTMLElement) {
  const tag = controller.tagName.toLowerCase()
  for(const el of controller.querySelectorAll(`[data-action*=":${tag}#"]`)) {
    // Ignore nested elements
    if (el.closest(tag) !== controller) continue

      // Match the pattern of `eventName:constructor#method`.
      for(const binding of (el.getAttribute('data-action')||'').split(' ')) {
        const [rest, method] = binding.split('#')
        const [eventName, handler] = rest.split(':')
        if (handler !== tag) continue

        // Check the `method` is present on the prototype
        const methodDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(controller), method)
        if (methodDescriptor && typeof methodDescriptor.value == 'function') {
          el.addEventListener(eventName, (event: Event) => {
            if (event.target === el) (controller as any)[method](event)
          })
        }

      }
  }
}
