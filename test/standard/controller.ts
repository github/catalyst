import {expect, fixture, html} from '@open-wc/testing'
import {fake} from 'sinon'
import {controller} from '../../src/controller.js'
import {attr} from '../../src/attr.js'

describe('controller (standard decorators)', () => {
  it('registers the element', async () => {
    @controller
    class StandardRegisterElement extends HTMLElement {}
    const instance = await fixture(html`<standard-register></standard-register>`)
    expect(instance).to.be.instanceof(StandardRegisterElement)
    expect(instance).to.have.attribute('data-catalyst', '')
  })

  it('registers the element with a custom name', async () => {
    @controller('standard-named-widget')
    class StandardNamedElement extends HTMLElement {}
    const instance = await fixture(html`<standard-named-widget></standard-named-widget>`)
    expect(instance).to.be.instanceof(StandardNamedElement)
    expect(instance).to.have.attribute('data-catalyst', '')
  })

  it('registers attrs when called as a function', async () => {
    controller('standard-function-attr')(
      class extends HTMLElement {
        @attr foo = 'bar'
      }
    )
    const instance = await fixture(html`<standard-function-attr></standard-function-attr>`)
    expect(instance.getAttribute('data-foo')).to.equal('bar')
  })

  it('binds actions', async () => {
    @controller
    class StandardBindElement extends HTMLElement {
      foo = fake()
    }
    const instance = await fixture<StandardBindElement>(html`
      <standard-bind><button data-action="click:standard-bind#foo"></button></standard-bind>
    `)
    instance.querySelector('button')!.click()
    expect(instance.foo).to.have.callCount(1)
  })

  it('defines the element after static fields are assigned', async () => {
    const changed: string[] = []
    @controller
    class StandardStaticsElement extends HTMLElement {
      static observedAttributes = ['data-extra']
      static attrPrefix = 'x-'
      @attr name = 'a'
      attributeChangedCallback(name: string) {
        changed.push(name)
      }
    }
    const instance = await fixture<StandardStaticsElement>(html`<standard-statics></standard-statics>`)
    expect(instance.getAttribute('x-name')).to.equal('a')
    changed.length = 0
    instance.setAttribute('data-extra', '1')
    instance.setAttribute('x-name', 'b')
    expect(changed).to.eql(['data-extra', 'x-name'])
    expect(instance.name).to.equal('b')
  })
})
