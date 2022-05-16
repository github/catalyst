import {expect} from '@open-wc/testing'
import {restore, replace, fake} from 'sinon'
import {register} from '../src/register.js'

describe('register', () => {
  afterEach(() => {
    restore()
  })

  it('registers the class as a custom element, normalising the class name', () => {
    @register
    class MyFirstClass extends HTMLElement {}
    expect(window.customElements.get('my-first-class')).to.equal(MyFirstClass)
  })

  it('does not register controllers that already exist', () => {
    {
      @register
      class MySecondClass extends HTMLElement {}
      expect(window.customElements.get('my-second-class')).to.equal(MySecondClass)
    }
    {
      @register
      class MySecondClass extends HTMLElement {}
      expect(window.customElements.get('my-second-class')).to.not.equal(MySecondClass)
    }
  })

  it('will redefine controllers, catching on errors', () => {
    replace(customElements, 'define', fake())
    replace(
      customElements,
      'get',
      fake(() => class extends HTMLElement {})
    )
    {
      @register
      class MyThirdClass extends HTMLElement {}
      expect(customElements.define).to.be.calledOnceWithExactly('my-third-class', MyThirdClass)
    }
    expect(() => {
      @register
      class MyThirdClass extends HTMLElement {}
      expect(customElements.define).to.be.calledOnceWithExactly('my-third-class', MyThirdClass)
    }).to.throw(Error)
  })

  it('dasherises class names', () => {
    @register
    class ThisIsAnExampleOfDasherisedClassNames extends HTMLElement {}
    expect(window.customElements.get('this-is-an-example-of-dasherised-class-names')).to.equal(
      ThisIsAnExampleOfDasherisedClassNames
    )
  })

  it('will intuitively dasherize acryonyms', () => {
    @register
    class URLBar extends HTMLElement {}
    expect(window.customElements.get('url-bar')).to.equal(URLBar)
  })

  it('dasherizes cap suffixed names correctly', () => {
    @register
    class ClipX extends HTMLElement {}
    expect(window.customElements.get('clip-x')).to.equal(ClipX)
  })

  it('automatically drops the `Element` suffix', () => {
    @register
    class FirstSuffixElement extends HTMLElement {}
    expect(window.customElements.get('first-suffix')).to.equal(FirstSuffixElement)
  })

  it('automatically drops the `Controller` suffix', () => {
    @register
    class SecondSuffixController extends HTMLElement {}
    expect(window.customElements.get('second-suffix')).to.equal(SecondSuffixController)
  })

  it('automatically drops the `Component` suffix', () => {
    @register
    class ThirdSuffixComponent extends HTMLElement {}
    expect(window.customElements.get('third-suffix')).to.equal(ThirdSuffixComponent)
  })
})
