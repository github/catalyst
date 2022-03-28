import {register} from './register.js'
import {bind, bindShadow} from './bind.js'
import {autoShadowRoot} from './auto-shadow-root.js'
import {defineObservedAttributes, initializeAttrs} from './attr.js'
import type {CustomElement} from './custom-element.js'

const instances = new WeakSet<Element>()

export function initializeInstance(instance: HTMLElement, connect?: (this: HTMLElement) => void): void {
  instance.toggleAttribute('data-catalyst', true)
  customElements.upgrade(instance)
  instances.add(instance)
  autoShadowRoot(instance)
  initializeAttrs(instance)
  bind(instance)
  if (connect) connect.call(instance)
  if (instance.shadowRoot) bindShadow(instance.shadowRoot)
}

export function initializeAttributeChanged(
  instance: HTMLElement,
  name: string,
  oldValue: unknown,
  newValue: unknown,
  attributeChangedCallback?: (this: HTMLElement, name: string, oldValue: unknown, newValue: unknown) => void
): void {
  initializeAttrs(instance)
  if (name !== 'data-catalyst' && attributeChangedCallback) {
    attributeChangedCallback.call(instance, name, oldValue, newValue)
  }
}

export function initializeClass(classObject: CustomElement): void {
  defineObservedAttributes(classObject)
  register(classObject)
}

export function initialized(el: Element): boolean {
  return instances.has(el)
}
