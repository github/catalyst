import {controller} from '../lib/controller.js'

describe('controller', () => {
  it('calls register', async () => {
    class ControllerRegisterElement extends HTMLElement {}
    controller(ControllerRegisterElement)
    const instance = document.createElement('controller-register')
    document.body.appendChild(instance)
    expect(instance).to.be.instanceof(ControllerRegisterElement)
  })

  it('adds data-catalyst to elements', async () => {
    controller(class ControllerDataAttrElement extends HTMLElement {})
    const instance = document.createElement('controller-data-attr')
    document.body.appendChild(instance)
    expect(instance.hasAttribute('data-catalyst')).to.equal(true)
    expect(instance.getAttribute('data-catalyst')).to.equal('')
  })

  it('binds controllers before custom connectedCallback behaviour', async () => {
    controller(class ControllerBindOrderElement extends HTMLElement {})
    controller(
      class ControllerBindOrderSubElement extends HTMLElement {
        connectedCallback() {
          this.dispatchEvent(new CustomEvent('loaded'))
        }
      }
    )

    const instance = document.createElement('controller-bind-order')
    chai.spy.on(instance, 'foo')
    document.body.appendChild(instance)

    const sub = document.createElement('controller-bind-order-sub')
    sub.setAttribute('data-action', 'loaded:controller-bind-order#foo')
    instance.appendChild(sub)

    expect(instance.foo).to.have.been.called(1)
  })
})
