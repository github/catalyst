import {wrap} from '../lib/wrap.js'
import chai from 'chai'
import spies from 'chai-spies'
chai.use(spies)
const {spy} = chai
const {expect} = chai

describe('wrap', () => {
  it('wraps a method that exists', () => {
    class MyController {
      connectedCallback() { }
    }
    spy.on(MyController.prototype, 'connectedCallback')
    const original = MyController.prototype.connectedCallback
    const fn = spy()
    wrap(MyController, 'connectedCallback', fn)
    const controller = new MyController()
    controller.connectedCallback('a')
    expect(fn).to.have.been.called.once.with.exactly('a')
    expect(original).to.have.been.called.once.with.exactly('a')
  })

  it('assigns the method that does not exist', () => {
    class MyController {}
    const fn = spy()
    wrap(MyController, 'connectedCallback', fn)
    const controller = new MyController()
    controller.connectedCallback('a')
    expect(fn).to.have.been.called.once.with.exactly('a')
  })
})
