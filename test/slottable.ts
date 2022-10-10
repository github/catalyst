import {expect, fixture} from '@open-wc/testing'
import {slot, mainSlot, slottable} from '../src/slottable.js'
const html = String.raw

describe('Slottable', () => {
  const sym = Symbol('bingBaz')
  @slottable
  class SlottableTest extends HTMLElement {
    @slot declare foo: HTMLSlotElement

    count = 0
    assigned = -1
    @slot set bar(barSlot: HTMLSlotElement) {
      this.assigned = barSlot?.assignedElements().length ?? -2
      this.count += 1
    }

    @slot declare [sym]: HTMLSlotElement;
    @slot declare [mainSlot]: HTMLSlotElement

    connectedCallback() {
      this.attachShadow({mode: 'open'}).innerHTML = html`
        <slot name="foo"></slot>
        <slot name="bar"></slot>
        <slot name="bing-baz"></slot>
        <slot></slot>
      `
    }
  }
  window.customElements.define('slottable-test', SlottableTest)

  let instance: SlottableTest
  beforeEach(async () => {
    instance = await fixture(html`<slottable-test />`)
  })

  it('queries the shadow root for the named slot', () => {
    expect(instance).to.have.property('foo').to.be.instanceof(HTMLSlotElement).with.attribute('name', 'foo')
    expect(instance).to.have.property('bar').to.be.instanceof(HTMLSlotElement).with.attribute('name', 'bar')
    expect(instance).to.have.property(sym).to.be.instanceof(HTMLSlotElement).with.attribute('name', 'bing-baz')
    expect(instance).to.have.property(mainSlot).to.be.instanceof(HTMLSlotElement).not.with.attribute('name')
  })

  it('calls setter on each change of the slots assigned nodes', async () => {
    expect(instance).to.have.property('count', 1)
    expect(instance).to.have.property('assigned', 0)
    instance.innerHTML = html`<p slot="bar">Foo</p>`
    await Promise.resolve()
    expect(instance).to.have.property('count', 2)
    expect(instance).to.have.property('assigned', 1)
    instance.innerHTML += html`<p slot="bar">Bar</p>`
    await Promise.resolve()
    expect(instance).to.have.property('count', 3)
    expect(instance).to.have.property('assigned', 2)
    instance.innerHTML = ''
    await Promise.resolve()
    expect(instance).to.have.property('count', 4)
    expect(instance).to.have.property('assigned', 0)
  })

  it('calls setter on each change of the slot', async () => {
    expect(instance).to.have.property('count', 1)
    expect(instance).to.have.property('assigned', 0)
    instance.shadowRoot!.querySelector('slot[name="bar"]')!.setAttribute('name', 'tmp')
    await Promise.resolve()
    expect(instance.bar).to.equal(null)
    expect(instance).to.have.property('count', 2)
    expect(instance).to.have.property('assigned', -2)
    instance.shadowRoot!.querySelector('slot[name="tmp"]')!.setAttribute('name', 'bar')
    await Promise.resolve()
    expect(instance.bar).to.be.an.instanceof(HTMLSlotElement).with.attribute('name', 'bar')
    expect(instance).to.have.property('count', 3)
    expect(instance).to.have.property('assigned', 0)
  })
})
