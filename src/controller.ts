import {initializeInstance, initializeClass} from './core.js'
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
    initializeInstance(this, connect)
  }
  initializeClass(classObject)
}
