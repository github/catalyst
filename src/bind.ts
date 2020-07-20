const controllers = new Set<string>()

/*
 * Bind `[data-action]` elements from the DOM to their actions.
 *
 */
export function bind(controller: HTMLElement): void {
  controllers.add(controller.tagName.toLowerCase())
  bindElements(controller)
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

function bindElements(root: Element) {
  for (const el of root.querySelectorAll('[data-action]')) {
    bindActions(el)
  }
  // Also bind the controller to itself
  if (root.hasAttribute('data-action')) {
    bindActions(root)
  }
}

function getActionEventName(action: string): string {
  return action.slice(0, action.lastIndexOf(':'))
}

function getActionControllerName(action: string): string {
  return action.slice(action.lastIndexOf(':') + 1, action.lastIndexOf('#'))
}

function getActionMethodName(action: string): string {
  return action.slice(action.lastIndexOf('#') + 1)
}

// Bind a single function to all events to avoid anonymous closure performance penalty.
function handleEvent(event: Event) {
  const el = event.currentTarget
  if (!(el instanceof Element)) return
  for (const action of (el.getAttribute('data-action') || '').split(' ')) {
    if (event.type !== getActionEventName(action)) continue
    const tagName = getActionControllerName(action)
    // Dispatch only to Catalyst elements.
    if (!controllers.has(tagName)) continue
    const controller = el.closest(tagName) as Element & Record<string, (ev: Event) => unknown>
    if (!controller) continue
    const method = getActionMethodName(action)
    if (typeof controller[method] === 'function') {
      controller[method](event)
    }
  }
}

function bindActions(el: Element) {
  for (const action of (el.getAttribute('data-action') || '').split(' ')) {
    el.addEventListener(getActionEventName(action), handleEvent)
  }
}
