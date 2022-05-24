import {CatalystDelegate} from './core.js'
import type {CustomElementClass} from './custom-element.js'
import {attrable} from './attrable.js'
import {actionable} from './actionable.js'

/**
 * Controller is a decorator to be used over a class that extends HTMLElement.
 * It will automatically `register()` the component in the customElement
 * registry, as well as ensuring `bind(this)` is called on `connectedCallback`,
 * wrapping the classes `connectedCallback` method if needed.
 */
export function controller(classObject: CustomElementClass): void {
  new CatalystDelegate(actionable(attrable(classObject)))
}
