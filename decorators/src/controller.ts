import {register} from '@catalyst/core'
import {bindEvents} from './bind'

interface CustomElement {
  new(): HTMLElement
}

export function controller(classObject: CustomElement) {
  register(classObject)
  bindEvents(classObject)
}
