import type {CustomElementClass} from './custom-element.js'
import {mustDasherize} from './dasherize.js'
import {meta} from './core.js'

const attrKey = 'attr'
type attrValue = string | number | boolean

/**
 * Attr is a decorator which tags a property as one to be initialized via
 * `initializeAttrs`.
 *
 * The signature is typed such that the property must be one of a String,
 * Number or Boolean. This matches the behavior of `initializeAttrs`.
 */
export function attr<K extends string>(proto: Record<K, attrValue>, key: K): void {
  meta(proto, attrKey).add(key)
}

/**
 * initializeAttrs is called with a set of class property names (if omitted, it
 * will look for any properties tagged with the `@attr` decorator). With this
 * list it defines property descriptors for each property that map to `data-*`
 * attributes on the HTMLElement instance.
 *
 * It works around Native Class Property semantics - which are equivalent to
 * calling `Object.defineProperty` on the instance upon creation, but before
 * `constructor()` is called.
 *
 * If a class property is assigned to the class body, it will infer the type
 * (using `typeof`) and define an appropriate getter/setter combo that aligns
 * to that type. This means class properties assigned to Numbers can only ever
 * be Numbers, assigned to Booleans can only ever be Booleans, and assigned to
 * Strings can only ever be Strings.
 *
 * This is automatically called as part of `@controller`. If a class uses the
 * `@controller` decorator it should not call this manually.
 *
 * Calling it again only initializes the property names that have not been
 * initialized yet, so a class may pass additional names (for example, from
 * its own `connectedCallback`) after `@controller` already initialized the
 * decorated ones.
 *
 * Implicit calls (no names given) short-circuit once the decorated names
 * are being initialized or are already done: reflecting a missing default
 * value back to an attribute synchronously invokes `attributeChangedCallback`,
 * which calls this again, and without the short-circuit each re-entrant call
 * would rescan every decorated name. Explicit calls are never short-circuited
 * and always initialize the names they are given.
 */
const initializedAttrs = new WeakMap<Element, Set<string>>()
const implicitAttrsState = new WeakMap<Element, 'in-progress' | 'completed'>()
export function initializeAttrs(instance: HTMLElement, names?: Iterable<string>): void {
  let initialized = initializedAttrs.get(instance)
  if (!initialized) {
    initialized = new Set()
    initializedAttrs.set(instance, initialized)
  }
  const proto = Object.getPrototypeOf(instance)
  const prefix = proto?.constructor?.attrPrefix ?? 'data-'
  const explicit = names != null
  let namesToInit: Iterable<string>
  if (explicit) {
    namesToInit = names as Iterable<string>
  } else {
    const state = implicitAttrsState.get(instance)
    if (state === 'in-progress' || state === 'completed') return
    implicitAttrsState.set(instance, 'in-progress')
    namesToInit = meta(proto, attrKey)
  }
  let completed = false
  try {
    for (const key of namesToInit) {
      // Skip names that were already initialized (for example, by an earlier
      // call from `@controller`, or by `attributeChangedCallback`). Mark the
      // name before defining its descriptor so a re-entrant call — for
      // example, one triggered by reflecting the default value back to an
      // attribute — does not define it twice.
      if (initialized.has(key)) continue
      initialized.add(key)
      const value = (<Record<PropertyKey, unknown>>(<unknown>instance))[key]
      const name = mustDasherize(`${prefix}${key}`)
      let descriptor: PropertyDescriptor = {
        configurable: true,
        get(this: HTMLElement): string {
          return this.getAttribute(name) || ''
        },
        set(this: HTMLElement, newValue: string) {
          this.setAttribute(name, newValue || '')
        }
      }
      if (typeof value === 'number') {
        descriptor = {
          configurable: true,
          get(this: HTMLElement): number {
            return Number(this.getAttribute(name) || 0)
          },
          set(this: HTMLElement, newValue: string) {
            this.setAttribute(name, newValue)
          }
        }
      } else if (typeof value === 'boolean') {
        descriptor = {
          configurable: true,
          get(this: HTMLElement): boolean {
            return this.hasAttribute(name)
          },
          set(this: HTMLElement, newValue: boolean) {
            this.toggleAttribute(name, newValue)
          }
        }
      }
      Object.defineProperty(instance, key, descriptor)
      if (key in instance && !instance.hasAttribute(name)) {
        descriptor.set!.call(instance, value)
      }
    }
    completed = true
  } finally {
    if (!explicit) {
      if (completed) {
        implicitAttrsState.set(instance, 'completed')
      } else {
        // The loop threw part-way: drop the state so a later implicit call
        // retries the names that were not initialized yet.
        implicitAttrsState.delete(instance)
      }
    }
  }
}

export function defineObservedAttributes(classObject: CustomElementClass): void {
  let observed = classObject.observedAttributes || []

  const prefix = classObject.attrPrefix ?? 'data-'
  const attrToAttributeName = (name: string) => mustDasherize(`${prefix}${name}`)

  Object.defineProperty(classObject, 'observedAttributes', {
    configurable: true,
    get() {
      return [...meta(classObject.prototype, attrKey)].map(attrToAttributeName).concat(observed)
    },
    set(attributes: string[]) {
      observed = attributes
    }
  })
}
