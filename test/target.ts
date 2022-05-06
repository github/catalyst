import {expect, fixture, html} from '@open-wc/testing'
import {target, targets} from '../src/target.js'
import {controller} from '../src/controller.js'

describe('Targetable', () => {
  @controller
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  class TargetTestElement extends HTMLElement {
    @target foo
    bar = 'hello'
    @target baz
    @target qux
    @target shadow

    @target bing
    @targets foos
    bars = 'hello'
    @target quxs
    @target shadows
  }

  let instance
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
      instance.shadowRoot.appendChild(el)
      expect(instance).to.have.property('shadow', el)
    })

    it('prioritises shadowRoot targets over others', async () => {
      instance.attachShadow({mode: 'open'})
      const shadowEl = document.createElement('div')
      shadowEl.setAttribute('data-target', 'target-test.foo')
      instance.shadowRoot.appendChild(shadowEl)
      expect(instance).to.have.property('foo', shadowEl)
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
      instance.shadowRoot.append(...els)

      expect(instance).to.have.property('foos').with.lengthOf(5)
      expect(instance).to.have.nested.property('foos[0]', els[0])
      expect(instance).to.have.nested.property('foos[1]', els[1])
      expect(instance).to.have.nested.property('foos[2]', els[2])
      expect(instance).to.have.nested.property('foos[3]').with.attribute('id', 'el4')
      expect(instance).to.have.nested.property('foos[4]').with.attribute('id', 'el5')
    })
  })
})
