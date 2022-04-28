import {expect} from '@open-wc/testing'
import {replace, fake} from 'sinon'
import {bind, listenForBind} from '../src/bind.js'

describe('bind', () => {
  window.customElements.define(
    'bind-test-element',
    class extends HTMLElement {
      foo() {
        return 'foo'
      }
      bar() {
        return 'bar'
      }
      handleEvent() {
        return 'handleEvent'
      }
    }
  )

  let root

  beforeEach(() => {
    root = document.createElement('div')
    document.body.appendChild(root)
  })

  afterEach(() => {
    root.remove()
  })

  it('binds events on elements based on their data-action attribute', () => {
    const instance = document.createElement('bind-test-element')
    replace(instance, 'foo', fake(instance.foo))
    const el = document.createElement('div')
    el.setAttribute('data-action', 'click:bind-test-element#foo')
    instance.appendChild(el)
    bind(instance)
    expect(instance.foo).to.have.callCount(0)
    el.click()
    expect(instance.foo).to.have.callCount(1)
  })

  it('allows for the presence of `:` in an event name', () => {
    const instance = document.createElement('bind-test-element')
    replace(instance, 'foo', fake(instance.foo))
    const el = document.createElement('div')
    el.setAttribute('data-action', 'custom:event:bind-test-element#foo')
    instance.appendChild(el)
    bind(instance)
    expect(instance.foo).to.have.callCount(0)
    el.dispatchEvent(new CustomEvent('custom:event'))
    expect(instance.foo).to.have.callCount(1)
  })

  it('binds events on the controller to itself', () => {
    const instance = document.createElement('bind-test-element')
    replace(instance, 'foo', fake(instance.foo))
    instance.setAttribute('data-action', 'click:bind-test-element#foo')
    bind(instance)
    expect(instance.foo).to.have.callCount(0)
    instance.click()
    expect(instance.foo).to.have.callCount(1)
  })

  it('does not bind elements whose closest selector is not this controller', () => {
    const instance = document.createElement('bind-test-element')
    replace(instance, 'foo', fake(instance.foo))
    const el = document.createElement('div')
    el.getAttribute('data-action', 'click:bind-test-element#foo')
    const container = document.createElement('div')
    container.append(instance, el)
    bind(instance)
    el.click()
    expect(instance.foo).to.have.callCount(0)
  })

  it('does not bind elements whose data-action does not match controller tagname', () => {
    const instance = document.createElement('bind-test-element')
    replace(instance, 'foo', fake(instance.foo))
    const el = document.createElement('div')
    el.setAttribute('data-action', 'click:other-controller#foo')
    instance.appendChild(el)
    bind(instance)
    expect(instance.foo).to.have.callCount(0)
    el.click()
    expect(instance.foo).to.have.callCount(0)
  })

  it('does not bind methods that dont exist', () => {
    const instance = document.createElement('bind-test-element')
    replace(instance, 'foo', fake(instance.foo))
    const el = document.createElement('div')
    el.setAttribute('data-action', 'click:bind-test-element#frob')
    instance.appendChild(el)
    bind(instance)
    el.click()
    expect(instance.foo).to.have.callCount(0)
  })

  it('can bind multiple event types', () => {
    const instance = document.createElement('bind-test-element')
    replace(instance, 'foo', fake(instance.foo))
    const el = document.createElement('div')
    el.setAttribute('data-action', 'click:bind-test-element#foo submit:bind-test-element#foo')
    instance.appendChild(el)
    bind(instance)
    expect(instance.foo).to.have.callCount(0)
    el.dispatchEvent(new CustomEvent('click'))
    expect(instance.foo).to.have.callCount(1)
    el.dispatchEvent(new CustomEvent('submit'))
    expect(instance.foo).to.have.callCount(2)
    expect(instance.foo.getCall(0).args[0].type).to.equal('click')
    expect(instance.foo.getCall(1).args[0].type).to.equal('submit')
  })

  it('binds to `handleEvent` is function name is omitted', () => {
    const instance = document.createElement('bind-test-element')
    replace(instance, 'handleEvent', fake(instance.handleEvent))
    const el = document.createElement('div')
    el.setAttribute('data-action', 'click:bind-test-element submit:bind-test-element')
    instance.appendChild(el)
    bind(instance)
    expect(instance.handleEvent).to.have.callCount(0)
    el.dispatchEvent(new CustomEvent('click'))
    expect(instance.handleEvent).to.have.callCount(1)
    el.dispatchEvent(new CustomEvent('submit'))
    expect(instance.handleEvent).to.have.callCount(2)
    expect(instance.handleEvent.getCall(0).args[0].type).to.equal('click')
    expect(instance.handleEvent.getCall(1).args[0].type).to.equal('submit')
  })

  it('can bind multiple actions separated by line feed', () => {
    const instance = document.createElement('bind-test-element')
    replace(instance, 'foo', fake(instance.foo))
    replace(instance, 'bar', fake(instance.bar))
    const el = document.createElement('div')
    el.setAttribute('data-action', `click:bind-test-element#foo\nclick:bind-test-element#bar`)
    instance.appendChild(el)
    bind(instance)
    expect(instance.foo).to.have.callCount(0)
    el.dispatchEvent(new CustomEvent('click'))
    expect(instance.foo).to.have.callCount(1)
    expect(instance.bar).to.have.callCount(1)
    expect(instance.foo.getCall(0).args[0].type).to.equal('click')
    expect(instance.bar.getCall(0).args[0].type).to.equal('click')
  })

  it('can bind multiple elements to the same event', () => {
    const instance = document.createElement('bind-test-element')
    replace(instance, 'foo', fake(instance.foo))
    const el1 = document.createElement('div')
    const el2 = document.createElement('div')
    el1.setAttribute('data-action', 'click:bind-test-element#foo')
    el2.setAttribute('data-action', 'submit:bind-test-element#foo')
    instance.append(el1, el2)
    bind(instance)
    expect(instance.foo).to.have.callCount(0)
    el1.click()
    expect(instance.foo).to.have.callCount(1)
    el2.dispatchEvent(new CustomEvent('submit'))
    expect(instance.foo).to.have.callCount(2)
  })

  it('binds elements added to elements subtree', async () => {
    const instance = document.createElement('bind-test-element')
    replace(instance, 'foo', fake(instance.foo))
    const el1 = document.createElement('div')
    const el2 = document.createElement('div')
    el1.setAttribute('data-action', 'click:bind-test-element#foo')
    el2.setAttribute('data-action', 'submit:bind-test-element#foo')
    document.body.appendChild(instance)

    bind(instance)

    instance.append(el1, el2)
    // We need to wait for one microtask after injecting the HTML into to
    // controller so that the actions have been bound to the controller.
    await Promise.resolve()
    document.body.removeChild(instance)

    expect(instance.foo).to.have.callCount(0)
    el1.click()
    expect(instance.foo).to.have.callCount(1)
    el2.dispatchEvent(new CustomEvent('submit'))
    expect(instance.foo).to.have.callCount(2)
  })

  it('can bind elements within the shadowDOM', () => {
    const instance = document.createElement('bind-test-element')
    replace(instance, 'foo', fake(instance.foo))
    instance.attachShadow({mode: 'open'})
    const el1 = document.createElement('div')
    const el2 = document.createElement('div')
    el1.setAttribute('data-action', 'click:bind-test-element#foo')
    el2.setAttribute('data-action', 'submit:bind-test-element#foo')
    instance.shadowRoot.append(el1, el2)
    bind(instance)
    expect(instance.foo).to.have.callCount(0)
    el1.click()
    expect(instance.foo).to.have.callCount(1)
    el2.dispatchEvent(new CustomEvent('submit'))
    expect(instance.foo).to.have.callCount(2)
  })

  it('binds elements added to shadowDOM', async () => {
    const instance = document.createElement('bind-test-element')
    replace(instance, 'foo', fake(instance.foo))
    instance.attachShadow({mode: 'open'})
    const el1 = document.createElement('div')
    const el2 = document.createElement('div')
    el1.setAttribute('data-action', 'click:bind-test-element#foo')
    el2.setAttribute('data-action', 'submit:bind-test-element#foo')
    bind(instance)
    instance.shadowRoot.append(el1)
    instance.shadowRoot.append(el2)
    // We need to wait for one microtask after injecting the HTML into to
    // controller so that the actions have been bound to the controller.
    await Promise.resolve()
    expect(instance.foo).to.have.callCount(0)
    el1.click()
    expect(instance.foo).to.have.callCount(1)
    el2.dispatchEvent(new CustomEvent('submit'))
    expect(instance.foo).to.have.callCount(2)
  })

  describe('listenForBind', () => {
    it('re-binds actions that are denoted by HTML that is dynamically injected into the controller', async function () {
      const instance = document.createElement('bind-test-element')
      bind(instance)
      replace(instance, 'foo', fake(instance.foo))
      root.appendChild(instance)
      listenForBind(root)
      const button = document.createElement('button')
      button.setAttribute('data-action', 'click:bind-test-element#foo')
      instance.appendChild(button)
      // We need to wait for one microtask after injecting the HTML into to
      // controller so that the actions have been bound to the controller.
      await Promise.resolve()
      button.click()
      expect(instance.foo).to.have.callCount(1)
    })

    it('will not re-bind actions after unsubscribe() is called', async function () {
      const instance = document.createElement('bind-test-element')
      replace(instance, 'foo', fake(instance.foo))
      root.appendChild(instance)
      listenForBind(root).unsubscribe()
      listenForBind(document).unsubscribe()
      const button = document.createElement('button')
      button.setAttribute('data-action', 'click:bind-test-element#foo')
      instance.appendChild(button)
      // We need to wait for one microtask after injecting the HTML into to
      // controller so that the actions have been bound to the controller.
      await Promise.resolve()
      button.click()
      expect(instance.foo).to.have.callCount(0)
    })

    it('will not bind elements that havent already had `bind()` called', async function () {
      customElements.define(
        'bind-test-not-element',
        class BindTestNotController extends HTMLElement {
          foo() {
            return 'foo'
          }
        }
      )
      const instance = document.createElement('bind-test-not-element')
      replace(instance, 'foo', fake(instance.foo))
      root.appendChild(instance)
      listenForBind(root)
      const button = document.createElement('button')
      button.setAttribute('data-action', 'click:bind-test-not-element#foo')
      instance.appendChild(button)
      // We need to wait for one microtask after injecting the HTML into to
      // controller so that the actions have been bound to the controller.
      await Promise.resolve()
      button.click()
      expect(instance.foo).to.have.callCount(0)
    })

    it('will not re-bind elements that just had `bind()` called', async function () {
      customElements.define(
        'bind-test-not-rebind-element',
        class BindTestNotController extends HTMLElement {
          connectedCallback() {
            bind(this)
          }
          foo() {
            return 'foo'
          }
        }
      )
      const instance = document.createElement('bind-test-not-rebind-element')
      replace(instance, 'foo', fake(instance.foo))
      listenForBind(root)
      const button = document.createElement('button')
      button.setAttribute('data-action', 'click:bind-test-not-rebind-element#foo')
      instance.appendChild(button)
      root.appendChild(instance)
      // wait for processQueue
      await Promise.resolve()
      button.click()
      expect(instance.foo).to.have.callCount(1)
    })
  })

  it('re-binds actions deeply in the HTML', async function () {
    const instance = document.createElement('bind-test-element')
    bind(instance)
    replace(instance, 'foo', fake(instance.foo))
    root.appendChild(instance)
    listenForBind(root)
    instance.innerHTML = `
        <div>
          <div>
            <button data-action="click:bind-test-element#foo">
          </div>
        </div>
      `
    // We need to wait for one microtask after injecting the HTML into to
    // controller so that the actions have been bound to the controller.
    await Promise.resolve()
    instance.querySelector('button').click()
    expect(instance.foo).to.have.callCount(1)
  })

  it('will not fire if the binding attribute is removed', () => {
    const instance = document.createElement('bind-test-element')
    replace(instance, 'foo', fake(instance.foo))
    const el1 = document.createElement('div')
    el1.setAttribute('data-action', 'click:bind-test-element#foo')
    instance.appendChild(el1)
    bind(instance)
    expect(instance.foo).to.have.callCount(0)
    el1.click()
    expect(instance.foo).to.have.callCount(1)
    el1.setAttribute('data-action', 'click:other-element#foo')
    el1.click()
    expect(instance.foo).to.have.callCount(1)
  })

  it('will rebind elements if the attribute changes', async function () {
    const instance = document.createElement('bind-test-element')
    replace(instance, 'foo', fake(instance.foo))
    root.appendChild(instance)
    const button = document.createElement('button')
    button.setAttribute('data-action', 'submit:bind-test-element#foo')
    instance.appendChild(button)
    bind(instance)
    listenForBind(root)
    await Promise.resolve()
    button.click()
    expect(instance.foo).to.have.callCount(0)
    button.setAttribute('data-action', 'click:bind-test-element#foo')
    await Promise.resolve()
    button.click()
    expect(instance.foo).to.have.callCount(1)
  })
})
