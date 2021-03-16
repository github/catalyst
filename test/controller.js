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
})
