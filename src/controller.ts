import {register} from './register'
import {bind, unbind} from './bind'
import {autoShadowRoot} from './auto-shadow-root'
import {wrap} from './wrap'

interface CustomElement {
  new (): HTMLElement
}

/**
 * Controller is a decorator to be used over a class that extends HTMLElement.
 * It will automatically `register()` the component in the customElement
 * registry, as well as ensuring `bind(this)` is called on `connectedCallback`,
 * wrapping the classes `connectedCallback` method if needed.
 */
export function controller(classObject: CustomElement): void {
  wrap(classObject.prototype, 'connectedCallback', function (this: HTMLElement) {
    this.toggleAttribute('data-catalyst', true)
    autoShadowRoot(this)
    bind(this)
  })
  wrap(classObject.prototype, 'disconnectedCallback', function (this: HTMLElement) {
    unbind(this)
  })
  register(classObject)
}
