interface CustomElement {
  new (): HTMLElement
}

/**
 * Register the controller as a custom element.
 *
 * The classname is converted to a approriate tag name.
 *
 * Example: HelloController => hello-controller
 */
export function register(classObject: CustomElement, extendsElement?: string): void {
  const name = classObject.name
    .replace(/([A-Z]($|[a-z]))/g, '-$1')
    .replace(/(^-|-Element$)/g, '')
    .toLowerCase()
  if (!window.customElements.get(name)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window[classObject.name] = classObject

    if (extendsElement) {
      window.customElements.define(name, classObject, {extends: extendsElement})
    } else {
      window.customElements.define(name, classObject)
    }
  }
}
