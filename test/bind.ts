import {expect, fixture, html} from '@open-wc/testing'
import {replace, fake} from 'sinon'
import {controller} from '../src/controller.js'
import {bindShadow} from '../src/bind.js'

describe('Actionable', () => {
  @controller
  class BindTestElement extends HTMLElement {
    foo = fake()
    bar = fake()
    handleEvent = fake()
  }
  let instance: BindTestElement
  beforeEach(async () => {
    instance = await fixture(html`<bind-test data-action="foo:bind-test#foo">
        <div id="el1" data-action="click:bind-test#foo"></div>
        <div id="el2" data-action="custom:event:bind-test#foo click:other-controller#foo"></div>
        <div id="el3" data-action="click:bind-test#baz focus:bind-test#foo submit:bind-test#foo"></div>
        <div id="el4" data-action="handle:bind-test other:bind-test"></div>
        <div
          id="el5"
          data-action="
            click:bind-test#foo
            click:bind-test#bar
          "
        ></div>
      </bind-test>
      <div id="el6" data-action="click:bind-test#foo"></div>`)
  })

  it('binds events on elements based on their data-action attribute', () => {
    expect(instance.foo).to.have.callCount(0)
    instance.querySelector<HTMLElement>('#el1')!.click()
    expect(instance.foo).to.have.callCount(1)
  })

  it('allows for the presence of `:` in an event name', () => {
    expect(instance.foo).to.have.callCount(0)
    instance.querySelector<HTMLElement>('#el2')!.dispatchEvent(new CustomEvent('custom:event'))
    expect(instance.foo).to.have.callCount(1)
  })

  it('binds events on the controller to itself', () => {
    expect(instance.foo).to.have.callCount(0)
    instance.dispatchEvent(new CustomEvent('foo'))
    expect(instance.foo).to.have.callCount(1)
  })

  it('does not bind elements whose closest selector is not this controller', () => {
    instance.ownerDocument.querySelector<HTMLElement>('#el6')!.click()
    expect(instance.foo).to.have.callCount(0)
  })

  it('does not bind elements whose data-action does not match controller tagname', () => {
    expect(instance.foo).to.have.callCount(0)
    instance.querySelector<HTMLElement>('#el2')!.click()
    expect(instance.foo).to.have.callCount(0)
  })

  it('does not bind methods that dont exist', () => {
    expect(instance.foo).to.have.callCount(0)
    instance.querySelector<HTMLElement>('#el3')!.click()
    expect(instance.foo).to.have.callCount(0)
  })

  it('can bind multiple event types', () => {
    expect(instance.foo).to.have.callCount(0)
    instance.querySelector<HTMLElement>('#el3')!.dispatchEvent(new CustomEvent('focus'))
    expect(instance.foo).to.have.callCount(1)
    instance.querySelector<HTMLElement>('#el3')!.dispatchEvent(new CustomEvent('submit'))
    expect(instance.foo).to.have.callCount(2)
    expect(instance.foo.getCall(0).args[0].type).to.equal('focus')
    expect(instance.foo.getCall(1).args[0].type).to.equal('submit')
  })

  it('binds to `handleEvent` is function name is omitted', () => {
    expect(instance.handleEvent).to.have.callCount(0)
    instance.querySelector<HTMLElement>('#el4')!.dispatchEvent(new CustomEvent('handle'))
    expect(instance.handleEvent).to.have.callCount(1)
    instance.querySelector<HTMLElement>('#el4')!.dispatchEvent(new CustomEvent('other'))
    expect(instance.handleEvent).to.have.callCount(2)
    expect(instance.handleEvent.getCall(0).args[0].type).to.equal('handle')
    expect(instance.handleEvent.getCall(1).args[0].type).to.equal('other')
  })

  it('can bind multiple actions separated by line feed', () => {
    expect(instance.foo).to.have.callCount(0)
    instance.querySelector<HTMLElement>('#el5')!.dispatchEvent(new CustomEvent('click'))
    expect(instance.foo).to.have.callCount(1)
    expect(instance.bar).to.have.callCount(1)
    expect(instance.foo.getCall(0).args[0].type).to.equal('click')
    expect(instance.bar.getCall(0).args[0].type).to.equal('click')
  })

  it('can bind multiple elements to the same event', () => {
    expect(instance.foo).to.have.callCount(0)
    instance.querySelector<HTMLElement>('#el1')!.click()
    expect(instance.foo).to.have.callCount(1)
    instance.querySelector<HTMLElement>('#el5')!.click()
    expect(instance.foo).to.have.callCount(2)
    expect(instance.foo.getCall(0).args[0].target.id).to.equal('el1')
    expect(instance.foo.getCall(1).args[0].target.id).to.equal('el5')
  })

  it('binds elements added to elements subtree', async () => {
    const el1 = document.createElement('div')
    const el2 = document.createElement('div')
    el1.setAttribute('data-action', 'click:bind-test#foo')
    el2.setAttribute('data-action', 'submit:bind-test#foo')
    instance.append(el1, el2)

    // We need to wait for one microtask after injecting the HTML into to
    // controller so that the actions have been bound to the controller.
    await Promise.resolve()

    expect(instance.foo).to.have.callCount(0)
    el1.click()
    expect(instance.foo).to.have.callCount(1)
    el2.dispatchEvent(new CustomEvent('submit'))
    expect(instance.foo).to.have.callCount(2)
  })

  it('can bind elements within the shadowDOM', async () => {
    const el1 = document.createElement('div')
    const el2 = document.createElement('div')
    el1.setAttribute('data-action', 'click:bind-test#foo')
    el2.setAttribute('data-action', 'submit:bind-test#foo')
    const shadowRoot = instance.attachShadow({mode: 'open'})
    bindShadow(shadowRoot)
    shadowRoot.append(el1, el2)

    // We need to wait for one microtask after injecting the HTML into to
    // controller so that the actions have been bound to the controller.
    await Promise.resolve()

    expect(instance.foo).to.have.callCount(0)
    el1.click()
    expect(instance.foo).to.have.callCount(1)
    el2.dispatchEvent(new CustomEvent('submit'))
    expect(instance.foo).to.have.callCount(2)
  })

  describe('mutations', () => {
    it('re-binds actions that are denoted by HTML that is dynamically injected into the controller', async function () {
      const button = document.createElement('button')
      button.setAttribute('data-action', 'click:bind-test#foo')
      instance.appendChild(button)

      // We need to wait for one microtask after injecting the HTML into to
      // controller so that the actions have been bound to the controller.
      await Promise.resolve()

      button.click()
      expect(instance.foo).to.have.callCount(1)
    })

    it('binds elements mutated in shadowDOM', async () => {
      const el1 = document.createElement('div')
      const el2 = document.createElement('div')
      const shadowRoot = instance.attachShadow({mode: 'open'})
      bindShadow(shadowRoot)
      shadowRoot.append(el1, el2)

      // We need to wait for one microtask after injecting the HTML into to
      // controller so that the actions have been bound to the controller.
      await Promise.resolve()

      el1.click()
      expect(instance.foo).to.have.callCount(0)

      el1.setAttribute('data-action', 'click:bind-test#foo')
      el2.setAttribute('data-action', 'submit:bind-test#foo')

      // We need to wait for one microtask after injecting the HTML into to
      // controller so that the actions have been bound to the controller.
      await Promise.resolve()

      expect(instance.foo).to.have.callCount(0)
      el1.click()
      expect(instance.foo).to.have.callCount(1)
      el2.dispatchEvent(new CustomEvent('submit'))
      expect(instance.foo).to.have.callCount(2)
    })

    it('re-binds actions deeply in the HTML', async function () {
      instance.innerHTML = `
          <div>
            <div>
              <button data-action="click:bind-test#foo">
            </div>
          </div>
        `
      // We need to wait for one microtask after injecting the HTML into to
      // controller so that the actions have been bound to the controller.
      await Promise.resolve()

      instance.querySelector('button')!.click()
      expect(instance.foo).to.have.callCount(1)
    })

    it('will not fire if the binding attribute is removed', () => {
      expect(instance.foo).to.have.callCount(0)
      const el = instance.querySelector<HTMLElement>('#el1')!

      el.click()
      expect(instance.foo).to.have.callCount(1)
      el.setAttribute('data-action', 'click:other-element#foo')
      el.click()
      expect(instance.foo).to.have.callCount(1)
    })

    it('will rebind elements if the attribute changes', async function () {
      expect(instance.foo).to.have.callCount(0)
      const el = instance.querySelector<HTMLElement>('#el1')!

      el.click()
      expect(instance.foo).to.have.callCount(1)
      el.setAttribute('data-action', 'submit:bind-test#foo')
      el.click()
      expect(instance.foo).to.have.callCount(1)

      // We need to wait for one microtask after injecting the HTML into to
      // controller so that the actions have been bound to the controller.
      await Promise.resolve()

      el.dispatchEvent(new CustomEvent('submit'))
      expect(instance.foo).to.have.callCount(2)
    })
  })
})
