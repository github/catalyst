import {bind, listenForBind} from '../lib/bind.js'

async function waitForNextAnimationFrame() {
  return new Promise(resolve => {
    window.requestAnimationFrame(resolve)
  })
}

describe('bind', () => {
  window.customElements.define('bind-test-element', class extends HTMLElement {})

  let root

  beforeEach(() => {
    root = document.createElement('div')
    document.body.appendChild(root)
  })

  afterEach(() => {
    root.remove()
  })

  it('queries for Elements matching data-action*="tagname"', () => {
    const instance = document.createElement('bind-test-element')
    chai.spy.on(instance, 'querySelectorAll', () => [])
    bind(instance)
    expect(instance.querySelectorAll).to.have.been.called.once.with.exactly('[data-action*=":bind-test-element#"]')
  })

  it('binds events on elements based on their data-action attribute', () => {
    const instance = document.createElement('bind-test-element')
    chai.spy.on(instance, 'foo')
    const el = document.createElement('div')
    el.setAttribute('data-action', 'click:bind-test-element#foo')
    instance.appendChild(el)
    bind(instance)
    expect(instance.foo).to.have.not.been.called()
    el.click()
    expect(instance.foo).to.have.been.called(1)
  })

  it('allows for the presence of `:` in an event name', () => {
    const instance = document.createElement('bind-test-element')
    chai.spy.on(instance, 'foo')
    const el = document.createElement('div')
    el.setAttribute('data-action', 'custom:event:bind-test-element#foo')
    instance.appendChild(el)
    bind(instance)
    expect(instance.foo).to.have.not.been.called()
    el.dispatchEvent(new CustomEvent('custom:event'))
    expect(instance.foo).to.have.been.called(1)
  })

  it('binds events on the controller to itself', () => {
    const instance = document.createElement('bind-test-element')
    chai.spy.on(instance, 'foo')
    instance.setAttribute('data-action', 'click:bind-test-element#foo')
    bind(instance)
    expect(instance.foo).to.have.not.been.called()
    instance.click()
    expect(instance.foo).to.have.been.called(1)
  })

  it('does not bind elements whose closest selector is not this controller', () => {
    const instance = document.createElement('bind-test-element')
    chai.spy.on(instance, 'foo')
    const el = document.createElement('div')
    el.getAttribute('data-action', 'click:bind-test-element#foo')
    const container = document.createElement('div')
    container.append(instance, el)
    bind(instance)
    el.click()
    expect(instance.foo).to.have.not.been.called()
  })

  it('does not bind elements whose data-action does not match controller tagname', () => {
    const instance = document.createElement('bind-test-element')
    chai.spy.on(instance, 'foo')
    const el = document.createElement('div')
    el.setAttribute('data-action', 'click:other-controller#foo')
    instance.appendChild(el)
    bind(instance)
    expect(instance.foo).to.have.not.been.called()
    el.click()
    expect(instance.foo).to.have.not.been.called()
  })

  it('does not bind methods that dont exist', () => {
    const instance = document.createElement('bind-test-element')
    chai.spy.on(instance, 'foo')
    const el = document.createElement('div')
    el.setAttribute('data-action', 'click:bind-test-element#frob')
    instance.appendChild(el)
    bind(instance)
    el.click()
    expect(instance.foo).to.have.not.been.called()
  })

  it('can bind multiple event types', () => {
    const instance = document.createElement('bind-test-element')
    chai.spy.on(instance, 'foo')
    const el = document.createElement('div')
    el.setAttribute('data-action', 'click:bind-test-element#foo submit:bind-test-element#foo')
    instance.appendChild(el)
    bind(instance)
    expect(instance.foo).to.have.not.been.called()
    el.dispatchEvent(new CustomEvent('click'))
    expect(instance.foo).to.have.been.called.exactly(1)
    el.dispatchEvent(new CustomEvent('submit'))
    expect(instance.foo).to.have.been.called.exactly(2)
    const calls = instance.foo.__spy.calls
    expect(calls).to.have.nested.property('[0][0].type', 'click')
    expect(calls).to.have.nested.property('[1][0].type', 'submit')
  })

  it('can bind multiple elements to the same event', () => {
    const instance = document.createElement('bind-test-element')
    chai.spy.on(instance, 'foo')
    const el1 = document.createElement('div')
    const el2 = document.createElement('div')
    el1.setAttribute('data-action', 'click:bind-test-element#foo')
    el2.setAttribute('data-action', 'submit:bind-test-element#foo')
    instance.append(el1, el2)
    bind(instance)
    expect(instance.foo).to.have.not.been.called()
    el1.click()
    expect(instance.foo).to.have.been.called.exactly(1)
    el2.dispatchEvent(new CustomEvent('submit'))
    expect(instance.foo).to.have.been.called.exactly(2)
  })

  describe('listenForBind', () => {
    it('re-binds actions that are denoted by HTML that is dynamically injected into the controller', async function () {
      const instance = document.createElement('bind-test-element')
      chai.spy.on(instance, 'foo')
      root.appendChild(instance)
      listenForBind(root)
      const button = document.createElement('button')
      button.setAttribute('data-action', 'click:bind-test-element#foo')
      instance.appendChild(button)
      // We need to wait for a couple of frames after injecting the HTML into to
      // controller so that the actions have been bound to the controller.
      await waitForNextAnimationFrame()
      await waitForNextAnimationFrame()
      button.click()
      expect(instance.foo).to.have.been.called.exactly(1)
    })

    it('will not re-bind actions after unsubscribe() is called', async function () {
      const instance = document.createElement('bind-test-element')
      chai.spy.on(instance, 'foo')
      root.appendChild(instance)
      listenForBind(root).unsubscribe()
      const button = document.createElement('button')
      button.setAttribute('data-action', 'click:bind-test-element#foo')
      instance.appendChild(button)
      // We need to wait for a couple of frames after injecting the HTML into to
      // controller so that the actions have been bound to the controller.
      await waitForNextAnimationFrame()
      await waitForNextAnimationFrame()
      button.click()
      expect(instance.foo).to.have.been.called.exactly(0)
    })

    it('will not bind elements that havent already had `bind()` called', async function () {
      customElements.define('bind-test-not-element', class BindTestNotController extends HTMLElement {})
      const instance = document.createElement('bind-test-not-element')
      chai.spy.on(instance, 'foo')
      root.appendChild(instance)
      listenForBind(root)
      const button = document.createElement('button')
      button.setAttribute('data-action', 'click:bind-test-not-element#foo')
      instance.appendChild(button)
      // We need to wait for a couple of frames after injecting the HTML into to
      // controller so that the actions have been bound to the controller.
      await waitForNextAnimationFrame()
      await waitForNextAnimationFrame()
      button.click()
      expect(instance.foo).to.have.been.called.exactly(0)
    })

    it('will not re-bind elements that just had `bind()` called', async function () {
      customElements.define(
        'bind-test-not-element',
        class BindTestNotController extends HTMLElement {
          connectedCallback() {
            bind(this)
          }
        }
      )
      const instance = document.createElement('bind-test-not-element')
      chai.spy.on(instance, 'foo')
      listenForBind(root)
      const button = document.createElement('button')
      button.setAttribute('data-action', 'click:bind-test-not-element#foo')
      instance.appendChild(button)
      root.appendChild(instance)
      // wait for processQueue
      await waitForNextAnimationFrame()
      await waitForNextAnimationFrame()
      button.click()
      expect(instance.foo).to.have.been.called.exactly(1)
    })
  })

  it('re-binds actions deeply in the HTML', async function () {
    const instance = document.createElement('bind-test-element')
    chai.spy.on(instance, 'foo')
    root.appendChild(instance)
    listenForBind(root)
    instance.innerHTML = `
        <div>
          <div>
            <button data-action="click:bind-test-element#foo">
          </div>
        </div>
      `
    // We need to wait for a couple of frames after injecting the HTML into to
    // controller so that the actions have been bound to the controller.
    await waitForNextAnimationFrame()
    await waitForNextAnimationFrame()
    instance.querySelector('button').click()
    expect(instance.foo).to.have.been.called.exactly(1)
  })

  it('will not fire if the binding attribute is removed', () => {
    const instance = document.createElement('bind-test-element')
    chai.spy.on(instance, 'foo')
    const el1 = document.createElement('div')
    el1.setAttribute('data-action', 'click:bind-test-element#foo')
    instance.appendChild(el1)
    bind(instance)
    expect(instance.foo).to.have.not.been.called()
    el1.click()
    expect(instance.foo).to.have.been.called.exactly(1)
    el1.setAttribute('data-action', 'click:other-element#foo')
    el1.click()
    expect(instance.foo).to.have.been.called.exactly(1)
  })

  it('will rebind elements if the attribute changes', async function () {
    const instance = document.createElement('bind-test-element')
    chai.spy.on(instance, 'foo')
    root.appendChild(instance)
    const button = document.createElement('button')
    button.setAttribute('data-action', 'submit:bind-test-element#foo')
    instance.appendChild(button)
    bind(instance)
    listenForBind(root)
    await waitForNextAnimationFrame()
    button.click()
    expect(instance.foo).to.have.been.called.exactly(0)
    button.setAttribute('data-action', 'click:bind-test-element#foo')
    await waitForNextAnimationFrame()
    await waitForNextAnimationFrame()
    button.click()
    expect(instance.foo).to.have.been.called.exactly(1)
  })
})
