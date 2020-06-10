import {findTarget, findTargets} from '../lib/findtarget.js'

class MyController extends HTMLElement {}
if (!window.customElements.get('my-controller')) {
  window.MyController = MyController
  window.customElements.define('my-controller', MyController)
}

describe('findTarget', () => {
  let root

  beforeEach(() => {
    root = document.createElement('div')
    document.body.appendChild(root)
  })

  afterEach(() => {
    root.remove()
  })

  it('calls querySelectorAll with the controller name and target name', () => {
    const instance = new MyController()
    chai.spy.on(instance, 'querySelectorAll', () => [])
    findTarget(instance, 'foo')
    expect(instance.querySelectorAll).to.have.been.called.once.with.exactly('[data-target~="my-controller.foo"]')
  })

  it('returns the first element where closest tag is the controller', () => {
    const els = [document.createElement('div'), document.createElement('div')]
    const instance = new MyController()
    chai.spy.on(instance, 'querySelectorAll', () => els)
    chai.spy.on(els[0], 'closest', () => null)
    chai.spy.on(els[1], 'closest', () => instance)
    const target = findTarget(instance, 'foo')
    expect(els[0].closest).to.have.been.called.once.with.exactly('my-controller')
    expect(els[1].closest).to.have.been.called.once.with.exactly('my-controller')
    expect(target).to.equal(els[1])
  })

  it('returns the first element that has the exact target name', () => {
    const instance = document.createElement('my-controller')

    const notExactMatch = document.createElement('div')
    notExactMatch.setAttribute('data-target', 'my-controller.foobar')
    const exactMatch = document.createElement('div')
    exactMatch.setAttribute('data-target', 'my-controller.foo')

    instance.appendChild(notExactMatch)
    instance.appendChild(exactMatch)

    const foundElement = findTarget(instance, 'foo')

    expect(foundElement).to.equal(exactMatch)
  })

  it('returns targets when there are mutliple target values', () => {
    const instance = document.createElement('my-controller')

    const el = document.createElement('div')
    el.setAttribute('data-target', 'my-controller.barfoo my-controller.foobar')

    instance.appendChild(el)

    const foundElement1 = findTarget(instance, 'foobar')
    const foundElement2 = findTarget(instance, 'barfoo')

    expect(foundElement1).to.equal(el)
    expect(foundElement2).to.equal(el)
  })

  it('returns targets when there are mutliple target values with different controllers', () => {
    const instance = document.createElement('my-controller')

    const el = document.createElement('div')
    el.setAttribute('data-target', 'other-controller.barfoo my-controller.foobar')

    instance.appendChild(el)

    const foundElement1 = findTarget(instance, 'foobar')
    const foundElement2 = findTarget(instance, 'barfoo')

    expect(foundElement1).to.equal(el)
    expect(foundElement2).to.equal(undefined)
  })
})

describe('findTargets', () => {
  it('calls querySelectorAll with the controller name and target name', () => {
    const instance = new MyController()
    chai.spy.on(instance, 'querySelectorAll', () => [])
    findTargets(instance, 'foo')
    expect(instance.querySelectorAll).to.have.been.called.once.with.exactly('[data-target~="my-controller.foo"]')
  })

  it('returns all elements where closest tag is the controller', () => {
    const els = [document.createElement('div'), document.createElement('div'), document.createElement('div')]
    const instance = new MyController()
    chai.spy.on(instance, 'querySelectorAll', () => els)
    chai.spy.on(els[0], 'closest', () => instance)
    chai.spy.on(els[1], 'closest', () => null)
    chai.spy.on(els[2], 'closest', () => instance)
    const targets = findTargets(instance, 'foo')
    expect(els[0].closest).to.have.been.called.once.with.exactly('my-controller')
    expect(els[1].closest).to.have.been.called.once.with.exactly('my-controller')
    expect(els[2].closest).to.have.been.called.once.with.exactly('my-controller')
    expect(targets).to.deep.equal([els[0], els[2]])
  })
})
