import type {CustomElement, CustomElementClass} from './custom-element.js'
import {createAbility} from './ability.js'

type FetchPriority = 'low' | 'high' | 'auto'
type LoadingBehavior = 'eager' | 'lazy' | 'auto'

interface LoadableInput {
  load(response: Response): Promise<void>
}

interface Loadable extends CustomElement {
  src: string
  loading: LoadingBehavior
  fetchpriority: FetchPriority
  load(response: Response): Promise<void>
}

interface Constructor<T> {
  // TS mandates Constructors that get mixins have `...args: any[]`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): T
}

declare global {
  interface RequestInit {
    priority: FetchPriority
  }
}

const task = () => new Promise(resolve => setTimeout(resolve, 0))

const observer = new IntersectionObserver(intersections => {
  for (const entry of intersections) {
    if (entry.isIntersecting) {
      load(entry.target as Loadable)
    }
  }
})

const inFlightElements = new WeakSet<Element>()
const abortControllers = new WeakMap<Element, AbortController>()

async function load(element: Loadable, {force = false} = {}) {
  if (!force && inFlightElements.has(element)) return
  if (!element.hasAttribute('src')) return

  abortControllers.get(element)?.abort()
  const controller = new AbortController()
  abortControllers.set(element, controller)
  const {signal} = controller

  await task()
  if (signal.aborted) return

  inFlightElements.add(element)

  element.dispatchEvent(new Event('loadstart'))
  const src = element.getAttribute('src')!
  try {
    const response = await fetch(src, {priority: element.fetchpriority, signal})
    element.load(response)

    task().then(() => {
      element.dispatchEvent(new Event('load'))
      element.dispatchEvent(new Event('loadend'))
    })
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      task().then(() => {
        element.dispatchEvent(new Event('error'))
        element.dispatchEvent(new Event('loadend'))
      })
      throw error
    }
  } finally {
    inFlightElements.delete(element)
  }
}

export const loadable = createAbility(
  <T extends CustomElementClass & Constructor<LoadableInput>>(Class: T): T & Constructor<Loadable> =>
    class extends Class {
      static observedAttributes = ['src', 'loading', 'fetchpriority', ...(Class.observedAttributes || [])]

      get src(): string {
        const src = this.getAttribute('src') || ''
        const url = new URL(src, window.location.href)
        return url.toString()
      }

      set src(value: unknown | null) {
        this.setAttribute('src', `${value}`)
      }

      // TS mandates Constructors that get mixins have `...args: any[]`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
        super(...args)
      }

      get fetchpriority(): FetchPriority {
        const priority = this.getAttribute('fetchpriority')
        if (priority === 'low') return 'low'
        if (priority === 'high') return 'high'
        return 'auto'
      }

      set fetchpriority(value: FetchPriority) {
        this.setAttribute('fetchpriority', `${value}`)
      }

      get loading(): LoadingBehavior {
        if (this.getAttribute('loading') === 'lazy') return 'lazy'
        return 'eager'
      }

      set loading(value: LoadingBehavior) {
        this.setAttribute('loading', `${value}`)
      }

      connectedCallback() {
        if (this.loading === 'eager' || this.loading === 'auto') {
          load(this)
        } else {
          observer.observe(this)
        }
      }

      attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        super.attributeChangedCallback?.(name, oldValue, newValue)

        if (oldValue !== newValue) {
          const eagerLoading = this.loading === 'eager' || this.loading === 'auto'
          if (name === 'src' && eagerLoading) {
            load(this, {force: true})
          } else if (name === 'loading' && eagerLoading) {
            load(this)
          }
        }
      }
    }
)
