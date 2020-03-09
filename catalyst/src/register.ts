/**
 * Register the controller as a custom element.
 *
 * The classname is converted to a approriate tag name.
 *
 * Example: HelloController => hello-controller
 */

interface CustomElement {
  new(): HTMLElement
}

export function register(classObject: CustomElement) {
  const name = classObject.name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase()
  if (!window.customElements.get(name)) {
    // @ts-ignore
    window[classObject.name] = classObject;
    window.customElements.define(name, classObject);
  }
}
