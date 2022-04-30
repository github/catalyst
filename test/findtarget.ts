import {expect, fixture, html} from '@open-wc/testing'
import {fake, replace} from 'sinon'
import {findTarget, findTargets} from '../src/findtarget.js'

describe('findTarget', () => {
  window.customElements.define('find-target-test-element', class extends HTMLElement {})

  let instance

  it('calls querySelectorAll with the controller name and target name', async () => {
    instance = await fixture(html`<find-target-test-element />`)
    replace(instance, 'querySelectorAll', fake.returns([]))
    findTarget(instance, 'foo')
    expect(instance.querySelectorAll).to.have.been.calledOnceWith('[data-target~="find-target-test-element.foo"]')
  })

  it('returns the first element where closest tag is the controller', async () => {
    instance = await fixture(html`
      <find-target-test-element>
        <find-target-test-element>
          <div id="1" data-target="find-target-test-element.foo"></div>
        </find-target-test-element>
        <div id="2" data-target="find-target-test-element.foo"></div>
      </find-target-test-element>
    `)
    expect(findTarget(instance, 'foo')).to.have.attribute('id', '2')
  })

  it('returns the first element that has the exact target name', async () => {
    instance = await fixture(html`
      <find-target-test-element>
        <div id="1" data-target="find-target-test-element.foobar"></div>
        <div id="2" data-target="find-target-test-element.foo"></div>
      </find-target-test-element>
    `)
    expect(findTarget(instance, 'foo')).to.have.attribute('id', '2')
  })

  it('returns targets when there are mutliple target values', async () => {
    instance = await fixture(html`
      <find-target-test-element>
        <div id="1" data-target="find-target-test-element.barfoo find-target-test-element.foobar"></div>
        <div id="2" data-target="find-target-test-element.foo"></div>
      </find-target-test-element>
    `)
    expect(findTarget(instance, 'foo')).to.have.attribute('id', '2')
    expect(findTarget(instance, 'barfoo')).to.have.attribute('id', '1')
    expect(findTarget(instance, 'barfoo')).to.equal(findTarget(instance, 'foobar'))
  })

  it('returns targets when there are mutliple target values with different controllers', async () => {
    instance = await fixture(html`
      <find-target-test-element>
        <div id="1" data-target="other-controller.barfoo find-target-test-element.foobar"></div>
      </find-target-test-element>
    `)
    expect(findTarget(instance, 'foobar')).to.have.attribute('id', '1')
    expect(findTarget(instance, 'barfoo')).to.equal(undefined)
  })

  it('returns targets from the shadowRoot, if available', async () => {
    instance = await fixture(html`<find-target-test-element></find-target-test-element>`)
    instance.attachShadow({mode: 'open'})
    const el = document.createElement('div')
    el.setAttribute('data-target', 'find-target-test-element.foobar')

    instance.shadowRoot.appendChild(el)

    expect(findTarget(instance, 'foobar')).to.equal(el)
  })

  it('prioritises shadowRoot targets over others', async () => {
    instance = await fixture(html` <find-target-test-element>
      <div data-target="find-target-test-element.foobar"></div>
    </find-target-test-element>`)
    instance.attachShadow({mode: 'open'})
    const shadowEl = document.createElement('div')
    shadowEl.setAttribute('data-target', 'find-target-test-element.foobar')
    instance.shadowRoot.appendChild(shadowEl)
    expect(findTarget(instance, 'foobar')).to.equal(shadowEl)
  })
})

describe('findTargets', () => {
  let instance

  it('calls querySelectorAll with the controller name and target name', async () => {
    instance = await fixture(html`<find-target-test-element>
      <div id="1" data-targets="find-target-test-element.foo"></div>
      <div id="2" data-targets="find-target-test-element.foo"></div>
      <div id="3" data-targets="find-target-test-element.bar"></div>
    </find-target-test-element>`)
    const els = findTargets(instance, 'foo')
    expect(els).to.have.lengthOf(2)
    expect(els[0]).to.have.attribute('id', '1')
    expect(els[1]).to.have.attribute('id', '2')
  })

  it('returns all elements where closest tag is the controller', async () => {
    instance = await fixture(html`<find-target-test-element>
      <div id="1" data-targets="find-target-test-element.foo"></div>
      <div id="2" data-targets="find-target-test-element.foo"></div>
      <find-target-test-element>
        <div id="3" data-targets="find-target-test-element.foo"></div>
      </find-target-test-element>
    </find-target-test-element>`)
    const els = findTargets(instance, 'foo')
    expect(els).to.have.lengthOf(2)
    expect(els[0]).to.have.attribute('id', '1')
    expect(els[1]).to.have.attribute('id', '2')
  })

  it('returns all elements inside a shadow root', async () => {
    instance = await fixture(html`<find-target-test-element></find-target-test-element>`)
    instance.attachShadow({mode: 'open'})
    const els = [document.createElement('div'), document.createElement('div'), document.createElement('div')]
    for (const el of els) el.setAttribute('data-targets', 'find-target-test-element.foo')

    instance.shadowRoot.append(els[1])
    instance.append(els[0], els[2])

    expect(findTargets(instance, 'foo')).to.eql([els[1], els[0], els[2]])
  })
})
