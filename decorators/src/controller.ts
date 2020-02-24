import {register} from '@catalyst/core'
import {bind} from './bind'

export function controller(classObject: Function) {
  register(classObject)
  bind(classObject)
}
