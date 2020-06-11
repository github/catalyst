import {findTarget, findTargets} from '../lib/findtarget.js'

describe('findTarget', () => {
  window.customElements.define('find-target-test-controller', class extends HTMLElement {})

  let root
  beforeEach(() => {
    root = document.createElement('div')
    document.body.appendChild(root)
  })

  afterEach(() => {
    root.remove()
  })

  it('calls querySelectorAll with the controller name and target name', () => {
    const instance = document.createElement('find-target-test-controller')
    chai.spy.on(instance, 'querySelectorAll', () => [])
    findTarget(instance, 'foo')
    expect(instance.querySelectorAll).to.have.been.called.once.with.exactly(
      '[data-target~="find-target-test-controller.foo"]'
    )
  })

  it('returns the first element where closest tag is the controller', () => {
    const els = [document.createElement('div'), document.createElement('div')]
    const instance = document.createElement('find-target-test-controller')
    chai.spy.on(instance, 'querySelectorAll', () => els)
    chai.spy.on(els[0], 'closest', () => null)
    chai.spy.on(els[1], 'closest', () => instance)
    const target = findTarget(instance, 'foo')
    expect(els[0].closest).to.have.been.called.once.with.exactly('find-target-test-controller')
    expect(els[1].closest).to.have.been.called.once.with.exactly('find-target-test-controller')
    expect(target).to.equal(els[1])
  })

  it('returns the first element that has the exact target name', () => {
    const instance = document.createElement('find-target-test-controller')

    const notExactMatch = document.createElement('div')
    notExactMatch.setAttribute('data-target', 'find-target-test-controller.foobar')
    const exactMatch = document.createElement('div')
    exactMatch.setAttribute('data-target', 'find-target-test-controller.foo')

    instance.appendChild(notExactMatch)
    instance.appendChild(exactMatch)

    const foundElement = findTarget(instance, 'foo')

    expect(foundElement).to.equal(exactMatch)
  })

  it('returns targets when there are mutliple target values', () => {
    const instance = document.createElement('find-target-test-controller')

    const el = document.createElement('div')
    el.setAttribute('data-target', 'find-target-test-controller.barfoo find-target-test-controller.foobar')

    instance.appendChild(el)

    const foundElement1 = findTarget(instance, 'foobar')
    const foundElement2 = findTarget(instance, 'barfoo')

    expect(foundElement1).to.equal(el)
    expect(foundElement2).to.equal(el)
  })

  it('returns targets when there are mutliple target values with different controllers', () => {
    const instance = document.createElement('find-target-test-controller')

    const el = document.createElement('div')
    el.setAttribute('data-target', 'other-controller.barfoo find-target-test-controller.foobar')

    instance.appendChild(el)

    const foundElement1 = findTarget(instance, 'foobar')
    const foundElement2 = findTarget(instance, 'barfoo')

    expect(foundElement1).to.equal(el)
    expect(foundElement2).to.equal(undefined)
  })
})

describe('findTargets', () => {
  it('calls querySelectorAll with the controller name and target name', () => {
    const instance = document.createElement('find-target-test-controller')
    chai.spy.on(instance, 'querySelectorAll', () => [])
    findTargets(instance, 'foo')
    expect(instance.querySelectorAll).to.have.been.called.once.with.exactly(
      '[data-target~="find-target-test-controller.foo"]'
    )
  })

  it('returns all elements where closest tag is the controller', () => {
    const els = [document.createElement('div'), document.createElement('div'), document.createElement('div')]
    const instance = document.createElement('find-target-test-controller')
    chai.spy.on(instance, 'querySelectorAll', () => els)
    chai.spy.on(els[0], 'closest', () => instance)
    chai.spy.on(els[1], 'closest', () => null)
    chai.spy.on(els[2], 'closest', () => instance)
    const targets = findTargets(instance, 'foo')
    expect(els[0].closest).to.have.been.called.once.with.exactly('find-target-test-controller')
    expect(els[1].closest).to.have.been.called.once.with.exactly('find-target-test-controller')
    expect(els[2].closest).to.have.been.called.once.with.exactly('find-target-test-controller')
    expect(targets).to.deep.equal([els[0], els[2]])
  })
})
