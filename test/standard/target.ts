import {expect, fixture, html} from '@open-wc/testing'
import {target, targets} from '../../src/target.js'
import {controller} from '../../src/controller.js'
import {targetTests} from '../helpers/target-tests.js'

describe('Targetable (standard decorators)', () => {
  @controller
  class TargetTestElement extends HTMLElement {
    @target accessor foo!: Element
    bar = 'hello'
    @target accessor baz!: Element
    @target accessor qux!: Element
    @target accessor shadow!: Element
    @target accessor bing!: Element
    @targets accessor foos!: Element[]
  }

  targetTests()

  it('names the target in the assignment error', async () => {
    const instance = await fixture<TargetTestElement>(html`<target-test></target-test>`)
    expect(() => {
      instance.foo = document.body
    }).to.throw(TypeError, 'Cannot set @target foo')
    expect(() => {
      instance.foos = []
    }).to.throw(TypeError, 'Cannot set @targets foos')
  })

  it('throws for members other than public instance accessors', () => {
    const message = '@target must decorate a public instance accessor'
    expect(
      () =>
        class extends HTMLElement {
          // @ts-expect-error fields would shadow the getter
          @target foo!: Element
        }
    ).to.throw(TypeError, message)
    expect(
      () =>
        class extends HTMLElement {
          // @ts-expect-error static members are not supported
          @target static accessor foo: Element
        }
    ).to.throw(TypeError, message)
    expect(
      () =>
        class extends HTMLElement {
          // @ts-expect-error private members are not supported
          @target accessor #foo!: Element
        }
    ).to.throw(TypeError, message)
    expect(
      () =>
        class extends HTMLElement {
          // @ts-expect-error methods are not supported
          @targets foo() {
            return []
          }
        }
    ).to.throw(TypeError, '@targets must decorate a public instance accessor')
  })
})
