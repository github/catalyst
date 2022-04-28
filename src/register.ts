import type {CustomElement} from './custom-element.js'
import {dasherize} from './dasherize.js'

/**
 * Register the controller as a custom element.
 *
 * The classname is converted to a approriate tag name.
 *
 * Example: HelloController => hello-controller
 */
export function register(classObject: CustomElement): void {
  const name = dasherize(classObject.name).replace(/-element$/, '')
  if (!window.customElements.get(name)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window[classObject.name] = classObject
    window.customElements.define(name, classObject)
  }
}
