import {register} from './register'
import {bind} from './bind'
import {wrap} from './wrap'

interface CustomElement {
  new (): HTMLElement
}

function connect(classObject: CustomElement, tag?: string) {
  wrap(classObject.prototype, 'connectedCallback', function (this: HTMLElement) {
    this.toggleAttribute('data-catalyst', true)
    bind(this)
  })

  if (tag) {
    register(classObject, tag)
  } else {
    register(classObject)
  }
}

/**
 * Controller is a decorator to be used over a class that extends HTMLElement.
 * It will automatically `register()` the component in the customElement
 * registry, as well as ensuring `bind(this)` is called on `connectedCallback`,
 * wrapping the classes `connectedCallback` method if needed.
 */
export function controller(target: CustomElement): void
export function controller(tag: string): (classObject: CustomElement) => void
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function controller(classObjectOrString: CustomElement | string) {
  if (typeof classObjectOrString === 'string') {
    return function (classObject: CustomElement): void {
      connect(classObject, classObjectOrString)
    }
  } else {
    connect(classObjectOrString)
  }
}
