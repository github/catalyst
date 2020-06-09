import {register} from '../lib/register.js'

describe('register', () => {
  it('registers the class as a custom element, normalising the class name', () => {
    class MyFirstController {}
    register(MyFirstController)
    expect(window.customElements.get('my-first-controller')).to.equal(MyFirstController)
  })

  it('does not register controllers that already exist', () => {
    {
      class MySecondController {}
      register(MySecondController)
      expect(window.customElements.get('my-second-controller')).to.equal(MySecondController)
    }
    {
      class MySecondController {}
      register(MySecondController)
      expect(window.customElements.get('my-second-controller')).to.not.equal(MySecondController)
    }
  })

  it('dasherises class names', () => {
    class ThisIsAnExampleOfADasherisedClassName {}
    register(ThisIsAnExampleOfADasherisedClassName)
    expect(window.customElements.get('this-is-an-example-of-a-dasherised-class-name')).to.equal(
      ThisIsAnExampleOfADasherisedClassName
    )
  })
})
