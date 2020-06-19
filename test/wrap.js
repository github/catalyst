import {wrap} from '../lib/wrap.js'

describe('wrap', () => {
  it('wraps a method that exists', () => {
    class MyController {
      connectedCallback() {}
    }
    chai.spy.on(MyController.prototype, 'connectedCallback')
    const original = MyController.prototype.connectedCallback
    const fn = chai.spy()
    wrap(MyController.prototype, 'connectedCallback', fn)
    const controller = new MyController()
    controller.connectedCallback('a')
    expect(fn).to.have.been.called.once.with.exactly('a')
    expect(original).to.have.been.called.once.with.exactly('a')
  })

  it('assigns the method that does not exist', () => {
    class MyController {}
    const fn = chai.spy()
    wrap(MyController.prototype, 'connectedCallback', fn)
    const controller = new MyController()
    controller.connectedCallback('a')
    expect(fn).to.have.been.called.once.with.exactly('a')
  })
})
