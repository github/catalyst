import {register} from './register'
import {bind} from './bind'
import {wrap} from './wrap'

interface CustomElement {
  new(): HTMLElement
}

export function controller(classObject: CustomElement) {
  wrap(classObject, 'connectedCallback', bind)
  register(classObject)
}
