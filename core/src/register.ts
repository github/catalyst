import {dasherize} from './dasherize'
/**
 * Register the controller as a custom element.
 *
 * The classname is converted to a approriate tag name.
 *
 * Example: HelloController => hello-controller
 */
export function register(classObject: any) {
  const name = dasherize(classObject.name)
  if (!window.customElements.get(name)) {
    window[classObject.name] = classObject;
    window.customElements.define(name, classObject);
  }
}
