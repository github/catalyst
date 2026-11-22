import {expect, fixture, html} from '@open-wc/testing'
import {controller} from '../../src/controller.js'
import {attr} from '../../src/attr.js'
import type {CustomElementClass} from '../../src/custom-element.js'

// web-test-runner-standard.config.js compiles this file for ES2020, where TypeScript assigns static fields to the class
// an outer class decorator returns, not the class it decorated.
describe('Attr (standard decorators, ES2020)', () => {
  it('reads static fields when an outer class decorator replaces the class', async () => {
    const wrap = <C extends CustomElementClass>(classObject: C) => class extends classObject {}
    @wrap
    @controller
    class Es2020WrappedElement extends HTMLElement {
      static attrPrefix = 'x-'
      static observedAttributes = ['extra']
      @attr foo = 'default'
      changes = 0
      attributeChangedCallback(name: string) {
        if (name === 'extra') this.changes++
      }
    }
    expect(Es2020WrappedElement.observedAttributes).to.eql(['x-foo', 'extra'])
    const instance = await fixture<Es2020WrappedElement>(html`<es2020-wrapped></es2020-wrapped>`)
    expect(instance).to.have.attribute('x-foo', 'default')
    instance.setAttribute('extra', '1')
    expect(instance.changes).to.equal(1)
  })
})
