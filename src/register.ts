import type {CustomElement} from './custom-element.js'

/**
 * Register the controller as a custom element.
 *
 * The classname is converted to a approriate tag name.
 *
 * Example: HelloController => hello-controller
 */
export function register(classObject: CustomElement, options: any): void {
  const name = classObject.name
    .replace(/([A-Z]($|[a-z]))/g, '-$1')
    .replace(/(^-|-Element$)/g, '')
    .toLowerCase()
  if (!window.customElements.get(name)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window[classObject.name] = classObject
    window.customElements.define(name, classObject, options)
  }
}
