import {bind} from '../lib/bind.js'
import chai from 'chai'
import spies from 'chai-spies'
chai.use(spies)
const {spy, expect} = chai

describe('bind', () => {
  class FakeElement {
    addEventListener() {}
    getAttribute() {}
    closest() {}
  }
  class MyController {
    get tagName() { return 'my-controller' }
    querySelectorAll() {}
    foo() {}
  }

  it('queries for Elements matching data-action*="tagname"', () => {
    const instance = new MyController()
    spy.on(instance, 'querySelectorAll', () => [])
    bind(instance)
    expect(instance.querySelectorAll).to.have.been.called.once.with.exactly('[data-action*=":my-controller#"]')
  })

  it('binds events on elements based on their data-action attribute', () => {
    const instance = new MyController()
    spy.on(instance, 'foo')
    const el = new FakeElement()
    instance.querySelectorAll = () => [el]
    el.closest = () => instance
    el.getAttribute = () => 'click:my-controller#foo'
    spy.on(el, 'addEventListener')
    bind(instance)
    expect(el.addEventListener).to.have.been.called.once.with('click')
    const {calls} = el.addEventListener.__spy
    const fn = calls[0][1]
    expect(instance.foo).to.have.not.been.called()
    fn()
    expect(instance.foo).to.have.been.called(1)
  })

  it('does not bind elements whose closest selector is not this controller', () => {
    const instance = new MyController()
    spy.on(instance, 'foo')
    const el = new FakeElement()
    instance.querySelectorAll = () => [el]
    el.closest = () => null
    el.getAttribute = () => 'click:my-controller#foo'
    spy.on(el, 'addEventListener')
    bind(instance)
    expect(el.addEventListener).to.have.not.been.called()
  })

  it('does not bind elements whose data-action does not match controller tagname', () => {
    const instance = new MyController()
    spy.on(instance, 'foo')
    const el = new FakeElement()
    instance.querySelectorAll = () => [el]
    el.closest = () => null
    el.getAttribute = () => 'click:other-controller#foo'
    spy.on(el, 'addEventListener')
    bind(instance)
    expect(el.addEventListener).to.have.not.been.called()
  })

  it('does not bind methods that dont exist', () => {
    const instance = new MyController()
    spy.on(instance, 'foo')
    const el = new FakeElement()
    instance.querySelectorAll = () => [el]
    el.closest = () => instance
    el.getAttribute = () => 'click:my-controller#frob'
    spy.on(el, 'addEventListener')
    bind(instance)
    expect(el.addEventListener).to.have.not.been.called()
  })

  it('can bind multiple event types', () => {
    const instance = new MyController()
    spy.on(instance, 'foo')
    const el = new FakeElement()
    instance.querySelectorAll = () => [el]
    el.closest = () => instance
    el.getAttribute = () => 'click:my-controller#foo submit:my-controller#foo'
    spy.on(el, 'addEventListener')
    bind(instance)
    expect(el.addEventListener).to.have.been.called(2)
    expect(el.addEventListener).to.be.first.called.with('click')
    expect(el.addEventListener).to.be.second.called.with('submit')
    const {calls} = el.addEventListener.__spy
    expect(instance.foo).to.have.not.been.called()
    calls[0][1]('a')
    expect(instance.foo).to.have.been.called.once.with('a')
    calls[1][1]('b')
    expect(instance.foo).to.have.been.called.twice.second.with('b')
  })

  it('can bind multiple elements to the same event', () => {
    const instance = new MyController()
    spy.on(instance, 'foo')
    const el1 = new FakeElement()
    const el2 = new FakeElement()
    instance.querySelectorAll = () => [el1, el2]
    el1.closest = () => instance
    el2.closest = () => instance
    el1.getAttribute = () => 'click:my-controller#foo'
    el2.getAttribute = () => 'submit:my-controller#foo'
    spy.on(el1, 'addEventListener')
    spy.on(el2, 'addEventListener')
    bind(instance)
    expect(el1.addEventListener).to.be.called.once.with('click')
    expect(el2.addEventListener).to.be.called.once.with('submit')
    expect(instance.foo).to.have.not.been.called()
    el1.addEventListener.__spy.calls[0][1]('a')
    expect(instance.foo).to.have.been.called.once.with('a')
    el2.addEventListener.__spy.calls[0][1]('b')
    expect(instance.foo).to.have.been.called.twice.second.with('b')
  })

})
