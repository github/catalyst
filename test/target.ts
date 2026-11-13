import {target, targets} from '../src/target.js'
import {controller} from '../src/controller.js'
import {targetTests} from './helpers/target-tests.js'

describe('Targetable', () => {
  @controller
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  class TargetTestElement extends HTMLElement {
    @target foo!: Element
    bar = 'hello'
    @target baz!: Element
    @target qux!: Element
    @target shadow!: Element

    @target bing!: Element
    @targets foos!: Element[]
    bars = 'hello'
    @target quxs!: Element[]
    @target shadows!: Element[]
  }

  targetTests()
})
