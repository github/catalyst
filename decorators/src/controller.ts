import {register} from '@github/catalyst'
import {bindEvents} from './bind'

interface CustomElement {
  new(): HTMLElement
}

export function controller(classObject: CustomElement) {
  bindEvents(classObject)
  register(classObject)
}
