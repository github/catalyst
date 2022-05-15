import type {CustomElement} from '../src/custom-element.js'
import {expect, fixture, html} from '@open-wc/testing'
import {restore} from 'sinon'
import {createAbility} from '../src/ability.js'

describe('ability', () => {
  const calls: string[] = []
  const fakeable = createAbility(
    Class =>
      class extends Class {
        foo() {
          return 'foo!'
        }
        connectedCallback() {
          calls.push('fakeable connectedCallback')
          super.connectedCallback?.()
        }
        disconnectedCallback() {
          calls.push('fakeable disconnectedCallback')
          super.disconnectedCallback?.()
        }
        adoptedCallback() {
          calls.push('fakeable adoptedCallback')
          super.adoptedCallback?.()
        }
        attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
          calls.push('fakeable attributeChangedCallback')
          super.attributeChangedCallback?.(name, oldValue, newValue)
        }
      }
  )
  const otherfakeable = createAbility(
    Class =>
      class extends Class {
        bar() {
          return 'bar!'
        }
        connectedCallback() {
          calls.push('otherfakeable connectedCallback')
          super.connectedCallback?.()
        }
        disconnectedCallback() {
          calls.push('otherfakeable disconnectedCallback')
          super.disconnectedCallback?.()
        }
        adoptedCallback() {
          calls.push('otherfakeable adoptedCallback')
          super.adoptedCallback?.()
        }
        attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
          calls.push('otherfakeable attributeChangedCallback')
          super.attributeChangedCallback?.(name, oldValue, newValue)
        }
      }
  )
  class Element extends HTMLElement {
    connectedCallback() {}
    disconnectedCallback() {}
    adoptedCallback() {}
    attributeChangedCallback() {}
  }

  afterEach(() => restore())

  it('creates a function, which creates a subclass of the given class', async () => {
    const DElement = fakeable(Element)
    expect(DElement).to.have.property('prototype').instanceof(Element)
  })

  it('can be used in decorator position', async () => {
    @fakeable
    class DElement extends HTMLElement {}

    expect(DElement).to.have.property('prototype').instanceof(HTMLElement)
  })

  it('can be chained with multiple abilities', async () => {
    const DElement = fakeable(Element)
    expect(Element).to.not.equal(DElement)
    const D2Element = otherfakeable(DElement)
    expect(DElement).to.not.equal(D2Element)
    expect(DElement).to.have.property('prototype').be.instanceof(Element)
    expect(D2Element).to.have.property('prototype').be.instanceof(Element)
  })

  it('can be called multiple times, but only applies once', async () => {
    const MultipleFakeable = fakeable(fakeable(fakeable(fakeable(fakeable(Element)))))
    customElements.define('multiple-fakeable', MultipleFakeable)
    const instance: CustomElement = await fixture(html`<multiple-fakeable />`)
    expect(calls).to.eql(['fakeable connectedCallback'])
    instance.connectedCallback!()
    expect(calls).to.eql(['fakeable connectedCallback', 'fakeable connectedCallback'])
  })
})
