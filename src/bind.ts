const controllers = new WeakSet<Element>()

/*
 * Bind `[data-action]` elements from the DOM to their actions.
 *
 */
export function bind(controller: HTMLElement): void {
  controllers.add(controller)
  if (controller.shadowRoot) bindShadow(controller.shadowRoot)
  bindElements(controller)
  listenForBind(controller.ownerDocument)
}

export function bindShadow(root: ShadowRoot): void {
  bindElements(root)
  listenForBind(root)
}

const observers = new WeakMap<Node, Subscription>()
/**
 * Set up observer that will make sure any actions that are dynamically
 * injected into `el` will be bound to it's controller.
 *
 * This returns a Subscription object which you can call `unsubscribe()` on to
 * stop further live updates.
 */
export function listenForBind(el: Node = document): Subscription {
  if (observers.has(el)) return observers.get(el)!
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
  observer.observe(el, {childList: true, subtree: true, attributeFilter: ['data-action']})
  const subscription = {
    get closed() {
      return closed
    },
    unsubscribe() {
      closed = true
      observers.delete(el)
      observer.disconnect()
    }
  }
  observers.set(el, subscription)
  return subscription
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
    if (event.type === binding.type) {
      type EventDispatcher = HTMLElement & Record<string, (ev: Event) => unknown>
      const controller = el.closest<EventDispatcher>(binding.tag)!
      if (controllers.has(controller) && typeof controller[binding.method] === 'function') {
        controller[binding.method](event)
      }
      const root = el.getRootNode()
      if (root instanceof ShadowRoot && controllers.has(root.host) && root.host.matches(binding.tag)) {
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
    const methodSep = Math.max(0, action.lastIndexOf('#')) || action.length
    yield {
      type: action.slice(0, eventSep),
      tag: action.slice(eventSep + 1, methodSep),
      method: action.slice(methodSep + 1) || 'handleEvent'
    } || 'handleEvent'
  }
}

function bindActions(el: Element) {
  for (const binding of bindings(el)) {
    el.addEventListener(binding.type, handleEvent)
  }
}
