import {register} from './register.js'
import {bind, bindShadow} from './bind.js'
import {autoShadowRoot} from './auto-shadow-root.js'
import {defineObservedAttributes, initializeAttrs, removeAttrs} from './attr.js'
import type {CustomElement} from './custom-element.js'

/**
 * Controller is a decorator to be used over a class that extends HTMLElement.
 * It will automatically `register()` the component in the customElement
 * registry, as well as ensuring `bind(this)` is called on `connectedCallback`,
 * wrapping the classes `connectedCallback` method if needed.
 */
export function controller(classObject: CustomElement): void {
  const connect = classObject.prototype.connectedCallback
  classObject.prototype.connectedCallback = function (this: HTMLElement) {
    this.toggleAttribute('data-catalyst', true)
    autoShadowRoot(this)
    initializeAttrs(this)
    bind(this)
    if (connect) connect.call(this)
    if (this.shadowRoot) bindShadow(this.shadowRoot)
  }
  defineObservedAttributes(classObject)
  register(classObject)

  const disconnect = classObject.prototype.disconnectedCallback
  classObject.prototype.disconnectedCallback = function (this: HTMLElement) {
    removeAttrs(this)
    if (disconnect) disconnect.call(this)
  }
}
