import {expect, fixture, html} from '@open-wc/testing'
import {target, targets} from '../../src/target.js'
import {controller} from '../../src/controller.js'

describe('Targetable (standard decorators)', () => {
  @controller
  class StandardTargetElement extends HTMLElement {
    @target accessor foo!: Element
    bar = 'hello'
    @target accessor baz!: Element
    @target accessor qux!: Element
    @target accessor shadow!: Element
    @target accessor bing!: Element
    @targets accessor foos!: Element[]
  }

  let instance: StandardTargetElement
  beforeEach(async () => {
    instance = await fixture(html`<standard-target>
      <standard-target>
        <div id="el1" data-target="standard-target.barfoo standard-target.foobar"></div>
        <div id="el2" data-target="standard-target.foo" data-targets="standard-target.foos"></div>
        <div id="el3" data-target="standard-target.bing"></div>
      </standard-target>
      <div id="el4" data-target="standard-target.foo" data-targets="standard-target.foos"></div>
      <div id="el5" data-target="standard-target.baz" data-targets="standard-target.foos"></div>
      <div id="el6" data-target="standard-target.bar standard-target.bing"></div>
      <div id="el8" data-target="other-target.qux standard-target.qux"></div>
    </standard-target>`)
  })

  describe('target', () => {
    it('returns the first element where closest tag is the controller', () => {
      expect(instance).to.have.property('foo').exist.with.attribute('id', 'el4')
      expect(instance.querySelector('standard-target')).to.have.property('foo').exist.with.attribute('id', 'el2')
    })

    it('does not assign to non-target decorated properties', () => {
      expect(instance).to.have.property('bar', 'hello')
    })

    it('returns the element with the exact target name', () => {
      expect(instance).to.have.property('baz').exist.with.attribute('id', 'el5')
      expect(instance).to.have.property('bing').exist.with.attribute('id', 'el6')
      expect(instance).to.have.property('qux').exist.with.attribute('id', 'el8')
    })

    it('prioritises shadowRoot targets over others', () => {
      instance.attachShadow({mode: 'open'})
      const shadowEl = document.createElement('div')
      shadowEl.setAttribute('data-target', 'standard-target.foo')
      instance.shadowRoot!.appendChild(shadowEl)
      expect(instance).to.have.property('foo', shadowEl)
    })

    it('throws on assignment, like the getter-only legacy property', () => {
      expect(() => {
        instance.foo = document.body
      }).to.throw(TypeError, 'Cannot set @target foo')
    })
  })

  describe('targets', () => {
    it('returns all elements where closest tag is the controller', () => {
      expect(instance).to.have.property('foos').with.lengthOf(2)
      expect(instance).to.have.nested.property('foos[0]').with.attribute('id', 'el4')
      expect(instance).to.have.nested.property('foos[1]').with.attribute('id', 'el5')
    })

    it('throws on assignment', () => {
      expect(() => {
        instance.foos = []
      }).to.throw(TypeError, 'Cannot set @targets foos')
    })
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
