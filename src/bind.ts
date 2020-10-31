const controllers = new Set<string>()

/*
 * Bind `[data-action]` elements from the DOM to their actions.
 *
 */
export function bind(controller: HTMLElement): void {
  controllers.add(controller.tagName.toLowerCase())
  if (controller.shadowRoot) {
    bindElements(controller.shadowRoot)
    listenForBind(controller.shadowRoot)
  }
  bindElements(controller)
  listenForBind(controller.ownerDocument)
}

/**
 * Set up observer that will make sure any actions that are dynamically
 * injected into `el` will be bound to it's controller.
 *
 * This returns a Subscription object which you can call `unsubscribe()` on to
 * stop further live updates.
 */
export function listenForBind(el: Node = document): Subscription {
  let closed = false
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.target instanceof Element) {
        bindActions(mutation.target)
      } else if (mutation.type === 'childList' && mutation.addedNodes.length) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            bindElements(node)
          }
        }
      }
    }
  })
  observer.observe(el, {childList: true, subtree: true, attributes: true, attributeFilter: ['data-action']})
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

interface Subscription {
  closed: boolean
  unsubscribe(): void
}

function bindElements(root: Element | ShadowRoot) {
  for (const el of root.querySelectorAll('[data-action]')) {
    bindActions(el)
  }
  // Also bind the controller to itself
  if (root instanceof Element && root.hasAttribute('data-action')) {
    bindActions(root)
  }
}

// Bind a single function to all events to avoid anonymous closure performance penalty.
function handleEvent(event: Event) {
  const el = event.currentTarget as Element
  for (const binding of bindings(el)) {
    if (event.type === binding.type && controllers.has(binding.tag)) {
      type EventDispatcher = Element & Record<string, (ev: Event) => unknown>
      const controller = el.closest(binding.tag) as EventDispatcher
      if (controller && typeof controller[binding.method] === 'function') {
        controller[binding.method](event)
      }
      const root = el.getRootNode()
      if (root instanceof ShadowRoot && root.host.matches(binding.tag)) {
        const shadowController = root.host as EventDispatcher
        if (typeof shadowController[binding.method] === 'function') {
          shadowController[binding.method](event)
        }
      }
    }
  }
}

type Binding = {type: string; tag: string; method: string}
function* bindings(el: Element): Iterable<Binding> {
  for (const action of (el.getAttribute('data-action') || '').trim().split(/\s+/)) {
    const eventSep = action.lastIndexOf(':')
    const methodSep = action.lastIndexOf('#')
    const type = action.slice(0, eventSep)
    const tag = action.slice(eventSep + 1, methodSep)
    const method = action.slice(methodSep + 1)
    yield {type, tag, method}
  }
}

function bindActions(el: Element) {
  for (const binding of bindings(el)) {
    el.addEventListener(binding.type, handleEvent)
  }
}
