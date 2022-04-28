import {fake, replace} from 'sinon'
import {findTarget, findTargets} from '../src/findtarget.js'

describe('findTarget', () => {
  window.customElements.define('find-target-test-element', class extends HTMLElement {})

  let root
  beforeEach(() => {
    root = document.createElement('div')
    document.body.appendChild(root)
  })

  afterEach(() => {
    root.remove()
  })

  it('calls querySelectorAll with the controller name and target name', () => {
    const instance = document.createElement('find-target-test-element')
    replace(instance, 'querySelectorAll', fake.returns([]))
    findTarget(instance, 'foo')
    expect(instance.querySelectorAll).to.have.been.calledOnceWith('[data-target~="find-target-test-element.foo"]')
  })

  it('returns the first element where closest tag is the controller', () => {
    const els = [document.createElement('div'), document.createElement('div')]
    const instance = document.createElement('find-target-test-element')
    replace(instance, 'querySelectorAll', fake.returns(els))
    replace(els[0], 'closest', fake.returns(null))
    replace(els[1], 'closest', fake.returns(instance))
    const target = findTarget(instance, 'foo')
    expect(els[0].closest).to.have.been.calledOnceWith('find-target-test-element')
    expect(els[1].closest).to.have.been.calledOnceWith('find-target-test-element')
    expect(target).to.equal(els[1])
  })

  it('returns the first element that has the exact target name', () => {
    const instance = document.createElement('find-target-test-element')

    const notExactMatch = document.createElement('div')
    notExactMatch.setAttribute('data-target', 'find-target-test-element.foobar')
    const exactMatch = document.createElement('div')
    exactMatch.setAttribute('data-target', 'find-target-test-element.foo')

    instance.appendChild(notExactMatch)
    instance.appendChild(exactMatch)

    const foundElement = findTarget(instance, 'foo')

    expect(foundElement).to.equal(exactMatch)
  })

  it('returns targets when there are mutliple target values', () => {
    const instance = document.createElement('find-target-test-element')

    const el = document.createElement('div')
    el.setAttribute('data-target', 'find-target-test-element.barfoo find-target-test-element.foobar')

    instance.appendChild(el)

    const foundElement1 = findTarget(instance, 'foobar')
    const foundElement2 = findTarget(instance, 'barfoo')

    expect(foundElement1).to.equal(el)
    expect(foundElement2).to.equal(el)
  })

  it('returns targets when there are mutliple target values with different controllers', () => {
    const instance = document.createElement('find-target-test-element')

    const el = document.createElement('div')
    el.setAttribute('data-target', 'other-controller.barfoo find-target-test-element.foobar')

    instance.appendChild(el)

    const foundElement1 = findTarget(instance, 'foobar')
    const foundElement2 = findTarget(instance, 'barfoo')

    expect(foundElement1).to.equal(el)
    expect(foundElement2).to.equal(undefined)
  })

  it('returns targets from the shadowRoot, if available', () => {
    const instance = document.createElement('find-target-test-element')
    instance.attachShadow({mode: 'open'})
    const el = document.createElement('div')
    el.setAttribute('data-target', 'find-target-test-element.foobar')

    instance.shadowRoot.appendChild(el)

    expect(findTarget(instance, 'foobar')).to.equal(el)
  })

  it('prioritises shadowRoot targets over others', () => {
    const instance = document.createElement('find-target-test-element')
    instance.attachShadow({mode: 'open'})
    const shadowEl = document.createElement('div')
    shadowEl.setAttribute('data-target', 'find-target-test-element.foobar')
    const lightEl = document.createElement('div')
    lightEl.setAttribute('data-target', 'find-target-test-element.foobar')

    instance.shadowRoot.appendChild(shadowEl)
    instance.appendChild(lightEl)

    expect(findTarget(instance, 'foobar')).to.equal(shadowEl)
  })
})

describe('findTargets', () => {
  it('calls querySelectorAll with the controller name and target name', () => {
    const instance = document.createElement('find-target-test-element')
    const els = [document.createElement('div'), document.createElement('div'), document.createElement('div')]
    instance.append(...els)

    els[0].setAttribute('data-targets', 'find-target-test-element.foo')
    els[1].setAttribute('data-targets', 'find-target-test-element.foo')

    expect(findTargets(instance, 'foo')).to.eql([els[0], els[1]])
  })

  it('returns all elements where closest tag is the controller', () => {
    const instance = document.createElement('find-target-test-element')
    const els = [document.createElement('div'), document.createElement('div'), document.createElement('div')]
    for (const el of els) el.setAttribute('data-targets', 'find-target-test-element.foo')
    const nested = document.createElement('find-target-test-element')

    nested.append(els[1])
    instance.append(els[0], nested, els[2])

    expect(findTargets(instance, 'foo')).to.eql([els[0], els[2]])
  })

  it('returns all elements inside a shadow root', () => {
    const instance = document.createElement('find-target-test-element')
    instance.attachShadow({mode: 'open'})
    const els = [document.createElement('div'), document.createElement('div'), document.createElement('div')]
    for (const el of els) el.setAttribute('data-targets', 'find-target-test-element.foo')

    instance.shadowRoot.append(els[1])
    instance.append(els[0], els[2])

    expect(findTargets(instance, 'foo')).to.eql([els[1], els[0], els[2]])
  })
})
