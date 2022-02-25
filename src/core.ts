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

export function initializeClass(classObject: CustomElement): void {
  defineObservedAttributes(classObject)
  register(classObject)
}

export function initialized(el: Element): boolean {
  return instances.has(el)
}
