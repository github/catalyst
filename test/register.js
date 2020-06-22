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
    class ThisIsAnExampleOfDasherisedClassNames {}
    register(ThisIsAnExampleOfDasherisedClassNames)
    expect(window.customElements.get('this-is-an-example-of-dasherised-class-names')).to.equal(
      ThisIsAnExampleOfDasherisedClassNames
    )
  })

  it('will intuitively dasherize acryonyms', () => {
    class URLBar {}
    register(URLBar)
    expect(window.customElements.get('url-bar')).to.equal(URLBar)
  })

  it('automatically drops the `Element` suffix', () => {
    class ASuffixedElement {}
    register(ASuffixedElement)
    expect(window.customElements.get('a-suffixed')).to.equal(ASuffixedElement)
  })
})
