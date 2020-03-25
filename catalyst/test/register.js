import {register} from '../lib/register.js'
import chai from 'chai'
import spies from 'chai-spies'
chai.use(spies)
const {spy, expect} = chai

describe('register', () => {
  const elements = new Map()
  global.window = {
    customElements: {
      get(name) {
        return elements.get(name)
      },
      define(name, value) {
        return elements.set(name, value)
      }
    }
  }
  let sandbox
  beforeEach(() => {
    sandbox = spy.sandbox()
    sandbox.on(window.customElements, ['get', 'define'])
  })

  afterEach(() => {
    elements.clear()
    sandbox.restore()
  })

  it('registers the class as a custom element, normalising the class name', () => {
    class MyController {}
    register(MyController)
    expect(window.customElements.define).to.have.been.called.with('my-controller', MyController)
    expect(elements.get('my-controller')).to.equal(MyController)
  })

  it('does not register controllers that already exist', () => {
    elements.set('my-controller', {})
    class MyController {}
    register(MyController)
    expect(window.customElements.define).to.have.not.been.called()
  })

  it('dasherises class names', () => {
    class ThisIsAnExampleOfADasherisedClassName {}
    register(ThisIsAnExampleOfADasherisedClassName)
    expect(window.customElements.define).to.have.been.called.with('this-is-an-example-of-a-dasherised-class-name')
  })
})
