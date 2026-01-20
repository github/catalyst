import {CatalystDelegate} from './core.js'
import type {CustomElementClass} from './custom-element.js'
/**
 * Controller is a decorator to be used over a class that extends HTMLElement.
 * It will automatically `register()` the component in the customElement
 * registry, as well as ensuring `bind(this)` is called on `connectedCallback`,
 * wrapping the classes `connectedCallback` method if needed.
 */
export function controller(classObject: CustomElementClass): void
export function controller(name: string): (classObject: CustomElementClass) => void
export function controller(
  classObjectOrName: CustomElementClass | string
): void | ((classObject: CustomElementClass) => void) {
  if (typeof classObjectOrName === 'string') {
    return (classObject: CustomElementClass) => {
      new CatalystDelegate(classObject, classObjectOrName)
    }
  }
  new CatalystDelegate(classObjectOrName)
}
