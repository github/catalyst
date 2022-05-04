import {CatalystDelegate} from './core.js'
import type {CustomElement} from './custom-element.js'
/**
 * Controller is a decorator to be used over a class that extends HTMLElement.
 * It will automatically `register()` the component in the customElement
 * registry, as well as ensuring `bind(this)` is called on `connectedCallback`,
 * wrapping the classes `connectedCallback` method if needed.
 */
export function controller(name: string): (classObject: CustomElement) => void
export function controller(classObject: CustomElement): void
export function controller(classObjectOrName: string | CustomElement) {
  if (typeof classObjectOrName === 'string') {
    const name = classObjectOrName
    return (classObject: CustomElement) => {
      new CatalystDelegate(classObject, name)
    }
  }

  new CatalystDelegate(classObjectOrName)
}
