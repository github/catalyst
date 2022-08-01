type Strategy = (tagName: string) => Promise<void>

const dynamicElements = new Map<string, Set<() => void>>()

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
  document.addEventListener('touchstart', handler, listenerOptions)
  document.addEventListener('keydown', handler, listenerOptions)
  document.addEventListener('pointerdown', handler, listenerOptions)
})

const visible = (tagName: string): Promise<void> =>
  new Promise<void>(resolve => {
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
    for (const el of document.querySelectorAll(tagName)) {
      observer.observe(el)
    }
  })

const strategies: Record<string, Strategy> = {
  ready: () => ready,
  firstInteraction: () => firstInteraction,
  visible
}

export function addStrategy(name: string, strategy: Strategy) {
  if (name in strategies) {
    throw new Error(`Strategy ${name} already exists!`)
  }
  strategies[name] = strategy
}

const timers = new WeakMap<Element, number>()
function scan(node: Element = document.body) {
  cancelAnimationFrame(timers.get(node) || 0)
  timers.set(
    node,
    requestAnimationFrame(() => {
      for (const tagName of dynamicElements.keys()) {
        const child: Element | null = node.matches(tagName) ? node : node.querySelector(tagName)
        if (customElements.get(tagName) || child) {
          const strategyName = (child?.getAttribute('data-load-on') || 'ready') as keyof typeof strategies
          const strategy = strategyName in strategies ? strategies[strategyName] : strategies.ready
          // eslint-disable-next-line github/no-then
          for (const cb of dynamicElements.get(tagName) || []) strategy(tagName).then(cb)
          dynamicElements.delete(tagName)
          timers.delete(node)
        }
      }
    })
  )
}

const elementLoader = new MutationObserver(mutations => {
  if (!dynamicElements.size) return
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof Element) scan(node)
    }
  }
})

let first = true
export function lazyDefine(tagName: string, callback: () => void) {
  if (!dynamicElements.has(tagName)) dynamicElements.set(tagName, new Set<() => void>())
  dynamicElements.get(tagName)!.add(callback)

  if (first) {
    scan(document.body)
    elementLoader.observe(document, {subtree: true, childList: true})
    first = false
  }
}
