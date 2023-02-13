import type {CustomElementClass} from './custom-element.js'
import {targetable} from './targetable.js'
import {attrable} from './attrable.js'
import {actionable} from './actionable.js'
import {register} from './register.js'

/**
 * Controller is a decorator to be used over a class that extends HTMLElement.
 * It will automatically `register()` the component in the customElement
 * registry, as well as ensuring `bind(this)` is called on `connectedCallback`,
 * wrapping the classes `connectedCallback` method if needed.
 */
export function controller<T extends CustomElementClass>(Class: T) {
  return register(actionable(attrable(targetable(Class))))
}
