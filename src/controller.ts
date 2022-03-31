import {initializeInstance, initializeClass, initializeAttributeChanged} from './core.js'
import type {CustomElement} from './custom-element.js'
/**
 * Controller is a decorator to be used over a class that extends HTMLElement.
 * It will automatically `register()` the component in the customElement
 * registry, as well as ensuring `bind(this)` is called on `connectedCallback`,
 * wrapping the classes `connectedCallback` method if needed.
 */

 export function controller(options: any = {}) {
  return function (classObject: CustomElement): void {
    const connect = classObject.prototype.connectedCallback
    classObject.prototype.connectedCallback = function (this: HTMLElement) {
      initializeInstance(this, connect)
    }
    const attributeChanged = classObject.prototype.attributeChangedCallback
    classObject.prototype.attributeChangedCallback = function (
      this: HTMLElement,
      name: string,
      oldValue: unknown,
      newValue: unknown
    ) {
      initializeAttributeChanged(this, name, oldValue, newValue, attributeChanged)
    }
    initializeClass(classObject, options)
  }
}
