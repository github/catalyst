type Strategy = (tagName: string) => Promise<void>

const pending = new Map<string, Set<() => void>>()
const triggered = new Set<string>()

const ready = new Promise<void>(resolve => {
  if (document.readyState !== 'loading') {
    resolve()
  } else {
    document.addEventListener('readystatechange', () => resolve(), {once: true})
  }
})

const firstInteraction = new Promise<void>(resolve => {
  const controller = new AbortController()
  controller.signal.addEventListener('abort', () => resolve())
  const listenerOptions = {once: true, passive: true, signal: controller.signal}
  const handler = () => controller.abort()

  document.addEventListener('mousedown', handler, listenerOptions)
  // eslint-disable-next-line github/require-passive-events
  document.addEventListener('touchstart', handler, listenerOptions)
  document.addEventListener('keydown', handler, listenerOptions)
  document.addEventListener('pointerdown', handler, listenerOptions)
})

const visible = async (tagName: string): Promise<void> => {
  const observeIntersection = (elements: Element[]) => {
    return new Promise<void>(resolve => {
      const observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              resolve()
              observer.disconnect()
              return
            }
          }
        },
        {
          // Currently the threshold is set to 256px from the bottom of the viewport
          // with a threshold of 0.1. This means the element will not load until about
          // 2 keyboard-down-arrow presses away from being visible in the viewport,
          // giving us some time to fetch it before the contents are made visible
          rootMargin: '0px 0px 256px 0px',
          threshold: 0.01
        }
      )
      for (const element of elements) {
        observer.observe(element)
      }
    })
  }

  const waitForElement = () => {
    return new Promise<Element[]>(resolve => {
      const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          const addedNodes = Array.from(mutation.addedNodes)
          for (const node of addedNodes) {
            if (!(node instanceof Element)) continue

            const isMatch = node.matches(tagName)
            const descendant = node.querySelector(tagName)

            if (isMatch || descendant) {
              observer.disconnect()
              resolve(Array.from(document.querySelectorAll(tagName)))
              return
            }
          }
        }
      })

      observer.observe(document.documentElement, {childList: true, subtree: true})
    })
  }

  const existingElements = Array.from(document.querySelectorAll(tagName))

  if (existingElements.length > 0) {
    return observeIntersection(existingElements)
  }

  const foundElements = await waitForElement()
  return observeIntersection(foundElements)
}

const strategies: Record<string, Strategy> = {
  ready: () => ready,
  firstInteraction: () => firstInteraction,
  visible
}

type ElementLike = Element | Document | ShadowRoot

const observedTargets = new WeakSet<ElementLike>()
const timers = new WeakMap<ElementLike, number>()

function cleanupObserver() {
  if (pending.size === 0 && elementLoader) {
    elementLoader.disconnect()
    elementLoader = undefined
  }
}

function scan(element: ElementLike) {
  const currentTimer = timers.get(element)
  if (currentTimer) cancelAnimationFrame(currentTimer)

  const newTimer = requestAnimationFrame(() => {
    // FIX 7: Early return optimization
    if (pending.size === 0) return

    // FIX 7: Create snapshot to iterate safely
    const tagList = Array.from(pending.keys())

    for (const tagName of tagList) {
      const child: Element | null =
        element instanceof Element && element.matches(tagName) ? element : element.querySelector(tagName)
      if (customElements.get(tagName) || child) {
        // Skip if already triggered and no longer in pending
        if (triggered.has(tagName) && !pending.has(tagName)) continue

        triggered.add(tagName)

        const callbackSet = pending.get(tagName)
        pending.delete(tagName)

        const strategyName = (child?.getAttribute('data-load-on') || 'ready') as keyof typeof strategies
        const strategy = strategyName in strategies ? strategies[strategyName] : strategies.ready

        // FIX 5: Wrap callback execution in try-catch and handle rejections
        const callbackList = Array.from(callbackSet || [])
        for (const callback of callbackList) {
          strategy(tagName)
            // eslint-disable-next-line github/no-then
            .then(() => {
              try {
                callback()
              } catch (err) {
                reportError(err)
              }
            })
            // eslint-disable-next-line github/no-then
            .catch(reportError)
        }

        timers.delete(element)
      }
    }

    // FIX 4: Disconnect observer when all pending tags are processed
    cleanupObserver()
  })

  timers.set(element, newTimer)
}

let elementLoader: MutationObserver | undefined

export function lazyDefine(object: Record<string, () => void>): void
export function lazyDefine(tagName: string, callback: () => void): void
export function lazyDefine(tagNameOrObj: string | Record<string, () => void>, singleCallback?: () => void) {
  if (typeof tagNameOrObj === 'string' && singleCallback) {
    tagNameOrObj = {[tagNameOrObj]: singleCallback}
  }

  for (const [tagName, callback] of Object.entries(tagNameOrObj)) {
    // FIX 6: Late registration - execute immediately if already triggered AND elements exist
    if (triggered.has(tagName) && document.querySelector(tagName) !== null) {
      // eslint-disable-next-line github/no-then
      Promise.resolve().then(() => {
        try {
          callback()
        } catch (err) {
          reportError(err)
        }
      })
    } else {
      if (!pending.has(tagName)) {
        pending.set(tagName, new Set<() => void>())
      }
      pending.get(tagName)!.add(callback)
    }
  }
  observe(document)
}

export function observe(target: ElementLike): void {
  if (!elementLoader) {
    elementLoader = new MutationObserver(mutations => {
      if (!pending.size) return
      for (const mutation of mutations) {
        const nodes = mutation.addedNodes
        for (const node of nodes) {
          if (node instanceof Element) {
            scan(node)
          }
        }
      }
    })
  }

  scan(target)

  // FIX 3: Check observedTargets to avoid redundant observe() calls
  if (!observedTargets.has(target)) {
    observedTargets.add(target)
    elementLoader.observe(target, {subtree: true, childList: true})
  }
}
