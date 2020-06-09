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

// Match the pattern of `eventName:constructor#method`.
function* getActions(el: Element): Generator<[string, string, string]> {
  for (const binding of (el.getAttribute('data-action') || '').split(' ')) {
    const [rest, methodName] = binding.split('#')
    if (!methodName) continue

    // eventName may contain `:` so account for that
    // by splitting by the last instance of `:`
    const colonIndex = rest.lastIndexOf(':')
    if (colonIndex < 0) continue

    yield [rest.slice(0, colonIndex), rest.slice(colonIndex + 1), methodName]
  }
}

function bindActionToController(controller: HTMLElement, el: Element, methodName: string, eventName: string) {
  // Check the `method` is present on the prototype
  const methodDescriptor =
    Object.getOwnPropertyDescriptor(controller, methodName) ||
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(controller), methodName)
  if (methodDescriptor && typeof methodDescriptor.value == 'function') {
    el.addEventListener(eventName, (event: Event) => {
      methodDescriptor.value.call(controller, event)
    })
  }
}

// Bind the data-action attribute of a single element to the controller
function bindActionsToController(controller: HTMLElement, el: Element) {
  const tag = controller.tagName.toLowerCase()

  for (const [eventName, tagName, methodName] of getActions(el)) {
    if (tagName === tag) {
      bindActionToController(controller, el, methodName, eventName)
    }
  }
}

/**
 * Set up observer that will make sure any actions that are dynamically
 * injected into `el` will be bound to it's controller.
 */
export function listenForBind(el = document, batchSize = 30): void {
  const observer = new MutationObserver(mutations => {
    const queue = new Set<Element>()
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue
          if (node.hasAttribute('data-action')) {
            queue.add(node)
          }
        }
      }
    }
    if (queue.size) requestAnimationFrame(() => processQueue(queue, batchSize))
  })

  observer.observe(el, {childList: true, subtree: true})
}

function processQueue(queue: Set<Element>, batchSize: number) {
  let counter = batchSize
  for (const el of queue) {
    for (const [eventName, controllerTag, methodName] of getActions(el)) {
      const controller = el.closest(controllerTag)
      if (!(controller instanceof HTMLElement)) continue

      bindActionToController(controller, el, methodName, eventName)
    }
    queue.delete(el)

    counter -= 1
    if (counter === 0) break
  }
  if (queue.size !== 0) {
    requestAnimationFrame(() => processQueue(queue, batchSize))
  }
}
