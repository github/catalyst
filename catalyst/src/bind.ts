/*
 * Bind `[data-action]` elements from the DOM to their actions.
 *
 */
export function bind(controller: HTMLElement): void {
  const tag = controller.tagName.toLowerCase()
  const actionAttributeMatcher = `[data-action*=":${tag}#"]`

  for (const el of controller.querySelectorAll(actionAttributeMatcher)) {
    // Ignore nested elements
    if (el.closest(tag) !== controller) continue
    bindActionsToController(controller, el)
  }

  // Also bind the controller to itself
  if (controller.matches(actionAttributeMatcher)) {
    bindActionsToController(controller, controller)
  }
}

// Bind the data-action attribute of a single element to the controller
function bindActionsToController(controller: HTMLElement, el: Element) {
  const tag = controller.tagName.toLowerCase()

  // Match the pattern of `eventName:constructor#method`.
  for (const binding of (el.getAttribute('data-action') || '').split(' ')) {
    const [rest, method] = binding.split('#')

    // eventName may contain `:` so account for that
    // by splitting by the last instance of `:`
    const colonIndex = rest.lastIndexOf(':')
    if (colonIndex < 0) continue

    const handler = rest.slice(colonIndex + 1)
    if (handler !== tag) continue

    const eventName = rest.slice(0, colonIndex)

    // Check the `method` is present on the prototype
    const methodDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(controller), method)
    if (methodDescriptor && typeof methodDescriptor.value == 'function') {
      el.addEventListener(eventName, (event: Event) => {
        methodDescriptor.value.call(controller, event)
      })
    }
  }
}
