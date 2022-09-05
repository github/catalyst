import type {CustomElementClass, CustomElement} from './custom-element.js'
import {createAbility} from './ability.js'
import {observe} from './mark.js'

export interface Controllable {
  [attachShadowCallback]?(shadowRoot: ShadowRoot): void
  [attachInternalsCallback]?(internals: ElementInternals): void
  [markChangedCallback]?(props: Map<PropertyKey, unknown>): void
}
export interface ControllableClass {
  // TS mandates Constructors that get mixins have `...args: any[]`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): Controllable
}

export const attachShadowCallback = Symbol()
export const attachInternalsCallback = Symbol()
export const markChangedCallback = Symbol()

const shadows = new WeakMap<Controllable, ShadowRoot | undefined>()
const internals = new WeakMap<Controllable, ElementInternals>()
const internalsCalled = new WeakSet()
export const controllable = createAbility(
  <T extends CustomElementClass>(Class: T): T & ControllableClass =>
    class extends Class {
      // TS mandates Constructors that get mixins have `...args: any[]`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
        super(...args)
        const shadowRoot = this.shadowRoot
        if (shadowRoot && shadowRoot !== shadows.get(this)) this[attachShadowCallback](shadowRoot)
        if (!internalsCalled.has(this)) {
          try {
            this.attachInternals()
          } catch {
            // Ignore errors
          }
        }
        const queue = new Map<PropertyKey, unknown>()
        observe<Controllable>(this, async (prop: PropertyKey, oldValue: unknown, newValue: unknown) => {
          if (Object.is(newValue, oldValue)) return
          queue.set(prop, oldValue)
          if (queue.size > 1) return
          await Promise.resolve()
          const changed = new Map(queue)
          queue.clear()
          ;(this as Controllable)[markChangedCallback]?.(changed)
        })
      }

      connectedCallback() {
        this.setAttribute('data-catalyst', '')
        super.connectedCallback?.()
      }

      attachShadow(...args: [init: ShadowRootInit]): ShadowRoot {
        const shadowRoot = super.attachShadow(...args)
        this[attachShadowCallback](shadowRoot)
        return shadowRoot
      }

      [attachShadowCallback](this: CustomElement & Controllable, shadowRoot: ShadowRoot) {
        shadows.set(this, shadowRoot)
      }

      attachInternals(): ElementInternals {
        if (internals.has(this) && !internalsCalled.has(this)) {
          internalsCalled.add(this)
          return internals.get(this)!
        }
        const elementInternals = super.attachInternals()
        this[attachInternalsCallback](elementInternals)
        internals.set(this, elementInternals)
        return elementInternals
      }

      [attachInternalsCallback](elementInternals: ElementInternals) {
        const shadowRoot = elementInternals.shadowRoot
        if (shadowRoot && shadowRoot !== shadows.get(this)) {
          this[attachShadowCallback](shadowRoot)
        }
      }
    }
)
