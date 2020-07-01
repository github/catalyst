const bound = new Set<string>()
/*
 * Bind `[data-action]` elements from the DOM to their actions.
 *
 */
export function bind(controller: HTMLElement): void {
  const tag = controller.tagName.toLowerCase()
  bound.add(tag)
  const actionAttributeMatcher = `[data-action*=":${tag}#"]`

  for (const el of controller.querySelectorAll(actionAttributeMatcher)) {
    // Ignore nested elements
    if (el.closest(tag) !== controller) continue
    bindActionsToController(el)
  }

  // Also bind the controller to itself
  if (controller.matches(actionAttributeMatcher)) {
    bindActionsToController(controller)
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

const registeredEvents: WeakMap<Element, Set<string>> = new WeakMap()

function handleEvent(event: Event) {
  const el = event.currentTarget
  if (!(el instanceof Element)) return
  if (!el.hasAttribute('data-action')) return
  for (const [eventName, tagName, methodName] of getActions(el)) {
    if (eventName !== event.type) continue
    const controller = el.closest(tagName)
    if (!controller) continue
    const methodDescriptor =
      Object.getOwnPropertyDescriptor(controller, methodName) ||
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(controller), methodName)
    if (methodDescriptor && typeof methodDescriptor.value == 'function') {
      methodDescriptor.value.call(controller, event)
    }
  }
}

// Bind the data-action attribute of a single element to the controller
function bindActionsToController(el: Element) {
  for (const [eventName, tagName] of getActions(el)) {
    if (!bound.has(tagName)) continue
    const bindings = registeredEvents.get(el) || new Set()
    if (bindings.has(eventName)) continue
    el.addEventListener(eventName, handleEvent)
    bindings.add(eventName)
    registeredEvents.set(el, bindings)
  }
}

interface Subscription {
  closed: boolean
  unsubscribe(): void
}

/**
 * Set up observer that will make sure any actions that are dynamically
 * injected into `el` will be bound to it's controller.
 *
 * This returns a Subscription object which you can call `unsubscribe()` on to
 * stop further live updates.
 */
export function listenForBind(el: Node = document, batchSize = 30): Subscription {
  let closed = false

  const observer = new MutationObserver(mutations => {
    const queue = new Set<Element>()
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue
          queue.add(node)
        }
      } else if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'data-action' &&
        mutation.target instanceof Element
      ) {
        queue.add(mutation.target)
      }
    }
    if (queue.size) processQueue(queue, batchSize)
  })

  observer.observe(el, {attributes: true, attributeFilter: ['data-action'], childList: true, subtree: true})

  return {
    get closed() {
      return closed
    },
    unsubscribe() {
      closed = true
      observer.disconnect()
    }
  }
}

const animationFrame = () => new Promise(resolve => requestAnimationFrame(resolve))

async function processQueue(queue: Set<Element>, batchSize: number) {
  await animationFrame()
  let counter = 0
  for (const el of queue) {
    if (el.hasAttribute('data-action')) {
      bindActionsToController(el)
      queue.delete(el)
      if ((counter += 1) % batchSize === 0) await animationFrame()
    }
    for (const child of el.querySelectorAll('[data-action]')) {
      bindActionsToController(child)
      if ((counter += 1) % batchSize === 0) await animationFrame()
    }
  }
}
