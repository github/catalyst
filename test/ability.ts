import {expect, fixture, html} from '@open-wc/testing'
import {restore, fake} from 'sinon'
import {createAbility, attachShadowCallback, attachInternalsCallback} from '../src/ability.js'

describe('ability', () => {
  let calls = []
  const fakeable = createAbility(
    Class =>
      class extends Class {
        foo() {
          return 'foo!'
        }
        connectedCallback() {
          calls.push('fakeable connectedCallback')
          super.connectedCallback?.()
        }
        disconnectedCallback() {
          calls.push('fakeable disconnectedCallback')
          super.disconnectedCallback?.()
        }
        adoptedCallback() {
          calls.push('fakeable adoptedCallback')
          super.adoptedCallback?.()
        }
        attributeChangedCallback(...args) {
          calls.push('fakeable attributeChangedCallback')
          super.attributeChangedCallback?.(...args)
        }
      }
  )
  const otherfakeable = createAbility(
    Class =>
      class extends Class {
        bar() {
          return 'bar!'
        }
        connectedCallback() {
          calls.push('otherfakeable connectedCallback')
          super.connectedCallback?.()
        }
        disconnectedCallback() {
          calls.push('otherfakeable disconnectedCallback')
          super.disconnectedCallback?.()
        }
        adoptedCallback() {
          calls.push('otherfakeable adoptedCallback')
          super.adoptedCallback?.()
        }
        attributeChangedCallback(...args) {
          calls.push('otherfakeable attributeChangedCallback')
          super.attributeChangedCallback?.(...args)
        }
      }
  )
  class Element extends HTMLElement {
    connectedCallback() {}
    disconnectedCallback() {}
    adoptedCallback() {}
    attributeChangedCallback() {}
  }

  afterEach(() => restore())

  it('creates a function, which creates a subclass of the given class', async () => {
    const DElement = fakeable(Element)
    expect(DElement).to.have.property('prototype').instanceof(Element)
  })

  it('can be used in decorator position', async () => {
    @fakeable
    class DElement extends HTMLElement {}

    expect(DElement).to.have.property('prototype').instanceof(HTMLElement)
  })

  it('can be chained with multiple abilities', async () => {
    const DElement = fakeable(Element)
    expect(Element).to.not.equal(DElement)
    const D2Element = otherfakeable(DElement)
    expect(DElement).to.not.equal(D2Element)
    expect(DElement).to.have.property('prototype').be.instanceof(Element)
    expect(D2Element).to.have.property('prototype').be.instanceof(Element)
  })

  it('can be called multiple times, but only applies once', async () => {
    const MultipleFakeable = fakeable(fakeable(fakeable(fakeable(fakeable(Element)))))
    customElements.define('multiple-fakeable', MultipleFakeable)
    const instance = await fixture(html`<multiple-fakeable />`)
    expect(calls).to.eql(['fakeable connectedCallback'])
    instance.connectedCallback()
    expect(calls).to.eql(['fakeable connectedCallback', 'fakeable connectedCallback'])
  })

  describe('subclass behaviour', () => {
    const CoreTest = otherfakeable(fakeable(Element))
    customElements.define('core-test', CoreTest)

    let instance
    beforeEach(async () => {
      instance = await fixture(html`<core-test />`)
    })

    it('applies keys from delegate onto subclass upon instantiation', () => {
      expect(instance).to.have.property('foo')
      expect(instance.foo()).to.equal('foo!')
      expect(instance).to.have.property('bar')
      expect(instance.bar()).to.equal('bar!')
    })

    for (const method of ['connectedCallback', 'disconnectedCallback', 'adoptedCallback', 'attributeChangedCallback']) {
      it(`delegates to other ${method}s before class ${method}`, () => {
        calls = []
        instance[method]()
        expect(calls).to.eql([`otherfakeable ${method}`, `fakeable ${method}`])
      })
    }
  })

  describe('ability extension behaviour', () => {
    describe('attachShadowCallback', () => {
      let attachShadowFake
      let shadow
      beforeEach(() => {
        shadow = null
        attachShadowFake = fake()
      })

      const declarable = createAbility(
        Class =>
          class extends Class {
            [attachShadowCallback](...args) {
              super[attachShadowCallback](...args)
              return attachShadowFake.apply(this, args)
            }
          }
      )
      customElements.define(
        'declarative-shadow-ability',
        declarable(
          class extends HTMLElement {
            constructor() {
              super()
              // Declarative shadows run before constructor() is available, but
              // abilities run after element constructor
              shadow = HTMLElement.prototype.attachShadow.call(this, {mode: 'closed'})
            }
          }
        )
      )
      customElements.define(
        'closed-shadow-ability',
        declarable(
          class extends HTMLElement {
            constructor() {
              super()
              shadow = this.attachShadow({mode: 'closed'})
            }
          }
        )
      )
      customElements.define(
        'connected-shadow-ability',
        declarable(
          class extends HTMLElement {
            connectedCallback() {
              shadow = this.attachShadow({mode: 'closed'})
            }
          }
        )
      )
      customElements.define('manual-shadow-ability', declarable(class extends HTMLElement {}))

      customElements.define(
        'disallowed-shadow-ability',
        declarable(
          class extends HTMLElement {
            static disabledFeatures = ['shadow']
          }
        )
      )

      it('is called with shadowRoot of declarative ShadowDOM', async () => {
        const instance = await fixture(html`<declarative-shadow-ability></declarative-shadow-ability>`)
        expect(shadow).to.exist.and.be.instanceof(ShadowRoot)
        expect(attachShadowFake).to.be.calledOnce.calledOn(instance).and.calledWithExactly(shadow)
      })

      it('is called with shadowRoot from attachShadow call', async () => {
        const instance = await fixture(html`<manual-shadow-ability></manual-shadow-ability>`)
        shadow = instance.attachShadow({mode: 'closed'})
        expect(shadow).to.exist.and.be.instanceof(ShadowRoot)
        expect(attachShadowFake).to.be.calledOnce.calledOn(instance).and.calledWithExactly(shadow)
      })

      it('is called with shadowRoot from attachInternals call', async () => {
        const instance = await fixture(html`<closed-shadow-ability></closed-shadow-ability>`)
        expect(shadow).to.exist.and.be.instanceof(ShadowRoot)
        expect(attachShadowFake).to.be.calledOnce.calledOn(instance).and.calledWithExactly(shadow)
      })

      it('is called with shadowRoot from connectedCallback', async () => {
        const instance = await fixture(html`<connected-shadow-ability></connected-shadow-ability>`)
        expect(shadow).to.exist.and.be.instanceof(ShadowRoot)
        expect(attachShadowFake).to.be.calledOnce.calledOn(instance).and.calledWithExactly(shadow)
      })

      it('does not error if shadowdom is disabled', async () => {
        await fixture(html`<disabled-shadow-ability></disabled-shadow-ability>`)
        expect(attachShadowFake).to.be.have.callCount(0)
      })
    })

    describe('attachInternalsCallback', () => {
      let attachInternalsFake
      let internals
      beforeEach(() => {
        internals = null
        attachInternalsFake = fake()
      })

      const internable = createAbility(
        Class =>
          class extends Class {
            [attachInternalsCallback](...args) {
              super[attachInternalsCallback](...args)
              return attachInternalsFake.apply(this, args)
            }
          }
      )
      customElements.define(
        'internals-ability',
        internable(
          class extends HTMLElement {
            constructor() {
              super()
              internals = this.attachInternals()
            }
          }
        )
      )
      customElements.define('manual-internals-ability', internable(class extends HTMLElement {}))

      customElements.define(
        'disallowed-internals-ability',
        internable(
          class extends HTMLElement {
            static disabledFeatures = ['internals']
          }
        )
      )

      it('is called on constructor', async () => {
        const instance = await fixture(html`<manual-internals-ability></manual-internals-ability>`)
        expect(attachInternalsFake).to.be.calledOnce.calledOn(instance)
      })

      it('does not prevent attachInternals being called by userland class', async () => {
        const instance = await fixture(html`<internals-ability></internals-ability>`)
        expect(internals).to.exist.and.be.instanceof(ElementInternals)
        expect(attachInternalsFake).to.be.calledOnce.calledOn(instance).and.calledWithExactly(internals)
      })

      it('errors if userland calls attachInternals more than once', async () => {
        const instance = await fixture(html`<manual-internals-ability></manual-internals-ability>`)
        internals = instance.attachInternals()
        expect(internals).to.exist.and.be.instanceof(ElementInternals)
        expect(attachInternalsFake).to.be.calledOnce.calledOn(instance).and.calledWithExactly(internals)

        expect(() => instance.attachInternals()).to.throw(DOMException)
      })

      it('does not error if element internals are disabled', async () => {
        await fixture(html`<disallowed-internals-ability></disallowed-internals-ability>`)
        expect(attachInternalsFake).to.have.callCount(0)
      })
    })
  })
})
