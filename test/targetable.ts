import {expect, fixture, html} from '@open-wc/testing'
import {target, targets, targetable} from '../src/targetable.js'

describe('Targetable', () => {
  @targetable
  class TargetTest extends HTMLElement {
    @target foo!: Element
    bar = 'hello'
    count = 0
    _baz!: Element
    @target set baz(value: Element) {
      this.count += 1
      this._baz = value
    }
    @target qux!: Element
    @target shadow!: Element

    @target bing!: Element
    @target multiWord!: Element
    @targets foos!: Element[]
    bars = 'hello'
    @target quxs!: Element[]
    @target shadows!: Element[]
    @targets camelCase!: Element[]
  }
  window.customElements.define('target-test', TargetTest)

  let instance: TargetTest
  beforeEach(async () => {
    instance = await fixture(html`<target-test>
      <target-test>
        <div id="el1" data-target="target-test.barfoo target-test.foobar"></div>
        <div id="el2" data-target="target-test.foo" data-targets="target-test.foos"></div>
        <div id="el3" data-target="target-test.bing"></div>
      </target-test>
      <div id="el4" data-target="target-test.foo" data-targets="target-test.foos"></div>
      <div id="el5" data-target="target-test.baz" data-targets="target-test.foos"></div>
      <div id="el6" data-target="target-test.bar target-test.bing"></div>
      <div id="el7" data-target="target-test.bazbaz"></div>
      <div id="el8" data-target="other-target.qux target-test.qux"></div>
      <div id="el9" data-target="target-test.multi-word"></div>
      <div id="el10" data-target="target-test.multiWord"></div>
      <div id="el11" data-targets="target-test.camel-case"></div>
      <div id="el12" data-targets="target-test.camelCase"></div>
    </target-test>`)
  })

  describe('target', () => {
    it('returns the first element where closest tag is the controller', async () => {
      expect(instance).to.have.property('foo').exist.with.attribute('id', 'el4')
      expect(instance.querySelector('target-test')).to.have.property('foo').exist.with.attribute('id', 'el2')
    })

    it('does not assign to non-target decorated properties', async () => {
      expect(instance).to.have.property('bar', 'hello')
    })

    it('returns the first element that has the exact target name', async () => {
      expect(instance).to.have.property('baz').exist.with.attribute('id', 'el5')
    })

    it('returns target when there are mutliple target values', async () => {
      expect(instance).to.have.property('bing').exist.with.attribute('id', 'el6')
    })

    it('returns targets when there are mutliple target values with different controllers', async () => {
      expect(instance).to.have.property('qux').exist.with.attribute('id', 'el8')
    })

    it('returns targets from the shadowRoot, if available', async () => {
      instance.attachShadow({mode: 'open'})
      const el = document.createElement('div')
      el.setAttribute('data-target', 'target-test.shadow')
      instance.shadowRoot!.appendChild(el)
      expect(instance).to.have.property('shadow', el)
    })

    it('prioritises shadowRoot targets over others', async () => {
      instance.attachShadow({mode: 'open'})
      const shadowEl = document.createElement('div')
      shadowEl.setAttribute('data-target', 'target-test.foo')
      instance.shadowRoot!.appendChild(shadowEl)
      expect(instance).to.have.property('foo', shadowEl)
    })

    it('dasherises target name but falls back to authored case', async () => {
      expect(instance).to.have.property('multiWord').exist.with.attribute('id', 'el9')
      instance.querySelector('#el9')!.remove()
      expect(instance).to.have.property('multiWord').exist.with.attribute('id', 'el10')
    })

    it('calls setter when new target has been found', async () => {
      expect(instance).to.have.property('baz').exist.with.attribute('id', 'el5')
      expect(instance).to.have.property('_baz').exist.with.attribute('id', 'el5')
      instance.count = 0
      instance.querySelector('#el4')!.setAttribute('data-target', 'target-test.baz')
      await Promise.resolve()
      expect(instance).to.have.property('baz').exist.with.attribute('id', 'el4')
      expect(instance).to.have.property('_baz').exist.with.attribute('id', 'el4')
      expect(instance).to.have.property('count', 1)
    })
  })

  describe('targets', () => {
    it('returns all elements where closest tag is the controller', async () => {
      expect(instance).to.have.property('foos').with.lengthOf(2)
      expect(instance).to.have.nested.property('foos[0]').with.attribute('id', 'el4')
      expect(instance).to.have.nested.property('foos[1]').with.attribute('id', 'el5')
    })

    it('returns all elements inside a shadow root', async () => {
      instance.attachShadow({mode: 'open'})
      const els = [document.createElement('div'), document.createElement('div'), document.createElement('div')]
      for (const el of els) el.setAttribute('data-targets', 'target-test.foos')
      instance.shadowRoot!.append(...els)

      expect(instance).to.have.property('foos').with.lengthOf(5)
      expect(instance).to.have.nested.property('foos[0]', els[0])
      expect(instance).to.have.nested.property('foos[1]', els[1])
      expect(instance).to.have.nested.property('foos[2]', els[2])
      expect(instance).to.have.nested.property('foos[3]').with.attribute('id', 'el4')
      expect(instance).to.have.nested.property('foos[4]').with.attribute('id', 'el5')
    })

    it('returns camel case and dasherised element names', async () => {
      expect(instance).to.have.property('camelCase').with.lengthOf(2)
      expect(instance).to.have.nested.property('camelCase[0]').with.attribute('id', 'el11')
      expect(instance).to.have.nested.property('camelCase[1]').with.attribute('id', 'el12')
    })
  })
})
