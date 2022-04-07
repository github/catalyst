import {expect} from '@open-wc/testing'
import {replace, fake} from 'sinon'
import {controller} from '../lib/controller.js'
import {attr} from '../lib/attr.js'

describe('controller', () => {
  let root

  beforeEach(() => {
    root = document.createElement('div')
    document.body.appendChild(root)
  })

  afterEach(() => {
    root.remove()
  })

  it('calls register', async () => {
    class ControllerRegisterElement extends HTMLElement {}
    controller(ControllerRegisterElement)
    const instance = document.createElement('controller-register')
    root.appendChild(instance)
    expect(instance).to.be.instanceof(ControllerRegisterElement)
  })

  it('adds data-catalyst to elements', async () => {
    controller(class ControllerDataAttrElement extends HTMLElement {})
    const instance = document.createElement('controller-data-attr')
    root.appendChild(instance)
    expect(instance.hasAttribute('data-catalyst')).to.equal(true)
    expect(instance.getAttribute('data-catalyst')).to.equal('')
  })

  it('binds controllers before custom connectedCallback behaviour', async () => {
    controller(
      class ControllerBindOrderElement extends HTMLElement {
        foo() {
          return 'foo'
        }
      }
    )
    controller(
      class ControllerBindOrderSubElement extends HTMLElement {
        connectedCallback() {
          this.dispatchEvent(new CustomEvent('loaded'))
        }
      }
    )

    const instance = document.createElement('controller-bind-order')
    replace(instance, 'foo', fake(instance.foo))
    root.appendChild(instance)

    const sub = document.createElement('controller-bind-order-sub')
    sub.setAttribute('data-action', 'loaded:controller-bind-order#foo')
    instance.appendChild(sub)

    expect(instance.foo).to.have.callCount(1)
  })

  it('binds shadowRoots after connectedCallback behaviour', async () => {
    controller(
      class ControllerBindShadowElement extends HTMLElement {
        connectedCallback() {
          this.attachShadow({mode: 'open'})
          const button = document.createElement('button')
          button.setAttribute('data-action', 'click:controller-bind-shadow#foo')
          this.shadowRoot.appendChild(button)
        }

        foo() {
          return 'foo'
        }
      }
    )
    const instance = document.createElement('controller-bind-shadow')
    replace(instance, 'foo', fake(instance.foo))
    root.appendChild(instance)

    instance.shadowRoot.querySelector('button').click()

    expect(instance.foo).to.have.callCount(1)
  })

  it('binds auto shadowRoots', async () => {
    controller(
      class ControllerBindAutoShadowElement extends HTMLElement {
        foo() {
          return 'foo'
        }
      }
    )
    const instance = document.createElement('controller-bind-auto-shadow')
    const template = document.createElement('template')
    template.setAttribute('data-shadowroot', 'open')
    // eslint-disable-next-line github/unescaped-html-literal
    template.innerHTML = '<button data-action="click:controller-bind-auto-shadow#foo"></button>'
    instance.appendChild(template)
    replace(instance, 'foo', fake(instance.foo))
    root.appendChild(instance)

    expect(instance.shadowRoot).to.exist
    expect(instance).to.have.property('shadowRoot').not.equal(null)
    expect(instance.shadowRoot.children).to.have.lengthOf(1)
    instance.shadowRoot.querySelector('button').click()

    expect(instance.foo).to.have.callCount(1)
  })

  it('upgrades child decendants when connected', () => {
    controller(class ChildElementElement extends HTMLElement {})
    controller(
      class ParentElementElement extends HTMLElement {
        connectedCallback() {
          const child = this.querySelector('child-element')
          expect(child.matches(':defined')).to.equal(true)
        }
      }
    )

    // eslint-disable-next-line github/unescaped-html-literal
    root.innerHTML = '<parent-element><child-element></child-element></parent-element>'
  })

  describe('attrs', () => {
    let attrValues = []
    class AttributeTestElement extends HTMLElement {
      foo = 'baz'
      attributeChangedCallback() {
        attrValues.push(this.getAttribute('data-foo'))
        attrValues.push(this.foo)
      }
    }
    controller(AttributeTestElement)
    attr(AttributeTestElement.prototype, 'foo')

    beforeEach(() => {
      attrValues = []
    })

    it('initializes attrs as attributes in attributeChangedCallback', () => {
      const el = document.createElement('attribute-test')
      el.foo = 'bar'
      el.attributeChangedCallback()
      expect(attrValues).to.eql(['bar', 'bar'])
    })

    it('initializes attributes as attrs in attributeChangedCallback', () => {
      const el = document.createElement('attribute-test')
      el.setAttribute('data-foo', 'bar')
      el.attributeChangedCallback()
      expect(attrValues).to.eql(['bar', 'bar'])
    })
  })
})
