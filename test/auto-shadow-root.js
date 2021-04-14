import {autoShadowRoot} from '../lib/auto-shadow-root.js'

describe('autoShadowRoot', () => {
  window.customElements.define('autoshadowroot-test-element', class extends HTMLElement {})

  let root

  beforeEach(() => {
    root = document.createElement('div')
    document.body.appendChild(root)
  })

  afterEach(() => {
    root.remove()
  })

  it('automatically declares shadowroot for elements with `template[data-shadowroot]` children', () => {
    const instance = document.createElement('shadowroot-test-element')
    const template = document.createElement('template')
    template.innerHTML = 'Hello World'
    template.setAttribute('shadowroot', 'open')
    instance.appendChild(template)

    autoShadowRoot(instance)

    expect(instance).to.have.property('shadowRoot').not.equal(null)
    expect(instance.shadowRoot.textContent).to.equal('Hello World')
  })

  it('does not attach shadowroot without a template`data-shadowroot` child', () => {
    const instance = document.createElement('shadowroot-test-element')
    const template = document.createElement('template')
    template.setAttribute('data-notshadowroot', 'open')
    const otherTemplate = document.createElement('div')
    otherTemplate.setAttribute('shadowroot', 'open')
    instance.appendChild(template, otherTemplate)

    autoShadowRoot(instance)

    expect(instance).to.have.property('shadowRoot').equal(null)
  })

  it('does not attach shadowroots which are not direct children of the element', () => {
    const instance = document.createElement('shadowroot-test-element')
    const div = document.createElement('div')
    const template = document.createElement('template')
    template.setAttribute('data-notshadowroot', 'open')
    div.appendChild(template)
    instance.appendChild(div)

    autoShadowRoot(instance)

    expect(instance).to.have.property('shadowRoot').equal(null)
  })

  it('attaches shadowRoot nodes open by default', () => {
    const instance = document.createElement('shadowroot-test-element')
    const template = document.createElement('template')
    template.innerHTML = 'Hello World'
    template.setAttribute('shadowroot', '')
    instance.appendChild(template)

    autoShadowRoot(instance)

    expect(instance).to.have.property('shadowRoot').not.equal(null)
    expect(instance.shadowRoot.textContent).to.equal('Hello World')
  })

  it('attaches shadowRoot nodes closed if `data-shadowroot` is `closed`', () => {
    const instance = document.createElement('shadowroot-test-element')
    const template = document.createElement('template')
    template.innerHTML = 'Hello World'
    template.setAttribute('shadowroot', 'closed')
    instance.appendChild(template)

    let shadowRoot = null
    chai.spy.on(instance, 'attachShadow', (...args) => {
      shadowRoot = Element.prototype.attachShadow.apply(instance, args)
      return shadowRoot
    })

    autoShadowRoot(instance)

    expect(instance).to.have.property('shadowRoot').equal(null)
    expect(instance.attachShadow).to.have.been.called.once.with.exactly({mode: 'closed'})
    expect(shadowRoot.textContent).to.equal('Hello World')
  })
})
