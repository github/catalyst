import {register} from './register.js'
import {bind, bindShadow} from './bind.js'
import {autoShadowRoot} from './auto-shadow-root.js'
import {defineObservedAttributes, initializeAttrs} from './attr.js'
import type {CustomElement} from './custom-element.js'

const symbol = Symbol.for('catalyst')

export class CatalystDelegate {
  constructor(classObject: CustomElement, elementName?: string) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const delegate = this

    const connectedCallback = classObject.prototype.connectedCallback
    classObject.prototype.connectedCallback = function (this: HTMLElement) {
      delegate.connectedCallback(this, connectedCallback)
    }

    const disconnectedCallback = classObject.prototype.disconnectedCallback
    classObject.prototype.disconnectedCallback = function (this: HTMLElement) {
      delegate.disconnectedCallback(this, disconnectedCallback)
    }

    const attributeChangedCallback = classObject.prototype.attributeChangedCallback
    classObject.prototype.attributeChangedCallback = function (
      this: HTMLElement,
      name: string,
      oldValue: string | null,
      newValue: string | null
    ) {
      delegate.attributeChangedCallback(this, name, oldValue, newValue, attributeChangedCallback)
    }

    let observedAttributes = classObject.observedAttributes || []
    Object.defineProperty(classObject, 'observedAttributes', {
      configurable: true,
      get() {
        return delegate.observedAttributes(this, observedAttributes)
      },
      set(attributes: string[]) {
        observedAttributes = attributes
      }
    })

    defineObservedAttributes(classObject)
    register(classObject, elementName)
  }

  observedAttributes(instance: HTMLElement, observedAttributes: string[]) {
    return observedAttributes
  }

  connectedCallback(instance: HTMLElement, connectedCallback: () => void) {
    instance.toggleAttribute('data-catalyst', true)
    customElements.upgrade(instance)
    autoShadowRoot(instance)
    initializeAttrs(instance)
    bind(instance)
    connectedCallback?.call(instance)
    if (instance.shadowRoot) bindShadow(instance.shadowRoot)
  }

  disconnectedCallback(element: HTMLElement, disconnectedCallback: () => void) {
    disconnectedCallback?.call(element)
  }

  attributeChangedCallback(
    instance: HTMLElement,
    name: string,
    oldValue: string | null,
    newValue: string | null,
    attributeChangedCallback: (...args: unknown[]) => void
  ) {
    initializeAttrs(instance)
    if (name !== 'data-catalyst' && attributeChangedCallback) {
      attributeChangedCallback.call(instance, name, oldValue, newValue)
    }
  }
}

export function meta(proto: Record<PropertyKey, unknown>, name: string): Set<string> {
  if (!Object.prototype.hasOwnProperty.call(proto, symbol)) {
    const parent = proto[symbol] as Map<string, Set<string>> | undefined
    const map = (proto[symbol] = new Map<string, Set<string>>())
    if (parent) {
      for (const [key, value] of parent) {
        map.set(key, new Set(value))
      }
    }
  }
  const map = proto[symbol] as Map<string, Set<string>>
  if (!map.has(name)) map.set(name, new Set<string>())
  return map.get(name)!
}
