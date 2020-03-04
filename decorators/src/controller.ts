import {register} from '@catalyst/core'
import {bindEvents} from './bind'

export function controller(classObject: Function) {
  register(classObject)
  bindEvents(classObject)
}
