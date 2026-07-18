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
  // eslint-disable-next-line github/require-passive-events
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

type ElementLike = Element | Document | ShadowRoot

// Roots waiting to be scanned for pending tags.
const scanQueue: ElementLike[] = []
// A partially-processed tree walk, kept between frames so that a very large tree
// (100k+ nodes) can be scanned across multiple frames instead of in one long,
// input-blocking task.
let scanWalker: TreeWalker | null = null
let scanScheduled = false
let elementLoader: MutationObserver | undefined

// Maximum time a single scan pass may run before yielding back to the browser.
const SCAN_BUDGET_MS = 4
// How often (in nodes) to check the time budget. Checking every node would call
// performance.now() millions of times on large pages; checking periodically
// keeps that overhead negligible while still yielding promptly.
const SCAN_CHECK_INTERVAL = 1024

type PostTaskScheduler = {postTask(callback: () => void): Promise<unknown>}
const nativeScheduler = (globalThis as unknown as {scheduler?: PostTaskScheduler}).scheduler

function scan(element: ElementLike) {
  scanQueue.push(element)
  if (scanScheduled) return
  scanScheduled = true
  requestAnimationFrame(runScan)
}

// Resume an interrupted scan. Prefer `scheduler.postTask` (default 'user-visible'
// priority) so a large scan continues promptly after yielding to input rather
// than waiting a whole frame; fall back to requestAnimationFrame.
function scheduleScanContinuation() {
  scanScheduled = true
  if (nativeScheduler?.postTask) {
    // eslint-disable-next-line github/no-then
    nativeScheduler.postTask(runScan).catch(() => undefined)
  } else {
    requestAnimationFrame(runScan)
  }
}

function resolveTag(tagName: string, el: Element | null): void {
  const callbacks = dynamicElements.get(tagName)
  if (!callbacks) return
  dynamicElements.delete(tagName)
  const strategyName = (el?.getAttribute('data-load-on') || 'ready') as keyof typeof strategies
  const strategy = strategyName in strategies ? strategies[strategyName] : strategies.ready
  for (const callback of callbacks) {
    // Run each callback independently so one failure cannot prevent the others,
    // and surface errors through reportError instead of unhandled rejections.
    // eslint-disable-next-line github/no-then
    strategy(tagName).then(callback).catch(reportError)
  }
}

function stopScanning(): void {
  // Everything registered has resolved: drop any queued work and disconnect the
  // observer so it stops reacting to unrelated DOM mutations for the rest of the
  // page's lifetime.
  scanQueue.length = 0
  scanWalker = null
  if (elementLoader) {
    elementLoader.disconnect()
    elementLoader = undefined
  }
}

function runScan(): void {
  scanScheduled = false
  if (!dynamicElements.size) return stopScanning()

  const deadline = performance.now() + SCAN_BUDGET_MS

  // Cheap O(pendingTags) pass for tags already defined elsewhere, which need no
  // DOM lookup at all.
  for (const tagName of [...dynamicElements.keys()]) {
    if (customElements.get(tagName)) resolveTag(tagName, null)
  }
  if (!dynamicElements.size) return stopScanning()

  let sinceCheck = 0
  while (scanWalker || scanQueue.length) {
    if (!scanWalker) {
      const root = scanQueue.shift()!
      // A TreeWalker visits descendants only, so match the root element itself.
      if (root instanceof Element && dynamicElements.has(root.localName)) {
        resolveTag(root.localName, root)
        if (!dynamicElements.size) return stopScanning()
      }
      scanWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
    }

    for (let node = scanWalker.nextNode(); node; node = scanWalker.nextNode()) {
      const el = node as Element
      // Membership is O(1), so total cost is O(nodes) rather than
      // O(nodes × pendingTags).
      if (dynamicElements.has(el.localName)) {
        resolveTag(el.localName, el)
        if (!dynamicElements.size) return stopScanning()
      }
      if (++sinceCheck >= SCAN_CHECK_INTERVAL) {
        sinceCheck = 0
        if (performance.now() >= deadline) {
          // Out of budget — resume this same walker after yielding.
          scheduleScanContinuation()
          return
        }
      }
    }
    scanWalker = null // finished this root
  }
}

export function lazyDefine(object: Record<string, () => void>): void
export function lazyDefine(tagName: string, callback: () => void): void
export function lazyDefine(tagNameOrObj: string | Record<string, () => void>, singleCallback?: () => void) {
  if (typeof tagNameOrObj === 'string' && singleCallback) {
    tagNameOrObj = {[tagNameOrObj]: singleCallback}
  }
  for (const [tagName, callback] of Object.entries(tagNameOrObj)) {
    if (!dynamicElements.has(tagName)) dynamicElements.set(tagName, new Set<() => void>())
    dynamicElements.get(tagName)!.add(callback)
  }
  observe(document)
}

export function observe(target: ElementLike): void {
  // Nothing is waiting to be defined. Any tags that already resolved are now
  // real custom elements, so the browser upgrades their instances natively and
  // there is nothing for us to watch for. This keeps controllers that never use
  // lazyDefine — and those connecting after every definition has resolved —
  // completely free of observer cost (core.ts calls observe() for every
  // shadow-root controller on connect).
  if (!dynamicElements.size) return

  elementLoader ||= new MutationObserver(mutations => {
    if (!dynamicElements.size) return
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element) scan(node)
      }
    }
  })

  scan(target)

  elementLoader.observe(target, {subtree: true, childList: true})
}
