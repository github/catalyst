import {expect} from '@open-wc/testing'
import {restore, replace, fake} from 'sinon'
import {register} from '../src/register.js'
import {attr, defineObservedAttributes, initializeAttrs} from '../src/attr.js'
import type {CustomElementClass} from '../src/custom-element.js'

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

  it('registers the class it decorates when an outer class decorator replaces it', () => {
    const decorated: CustomElementClass[] = []
    const wrap = <C extends CustomElementClass>(classObject: C) => {
      decorated.push(classObject)
      return class extends classObject {}
    }
    // Legacy `register` returns the class, which TypeScript rejects for a class with members of its own.
    const registerClass = register as (classObject: CustomElementClass, context?: unknown) => void
    @wrap
    @registerClass
    @defineObservedAttributes
    class OuterRegisterElement extends HTMLElement {
      @attr foo = 'bar'
    }
    expect(OuterRegisterElement).to.exist
    expect(window.customElements.get('outer-register')).to.equal(decorated[0])
    expect(decorated[0].observedAttributes).to.include('data-foo')
  })

  it('initializes attrs of the class it decorates when an outer class decorator replaces it', async () => {
    const decorated: CustomElementClass[] = []
    const wrap = <C extends CustomElementClass>(classObject: C) => {
      decorated.push(classObject)
      return class extends classObject {}
    }
    const registerClass = register as (classObject: CustomElementClass, context?: unknown) => void
    @wrap
    @registerClass
    class OuterRegisterAttrsElement extends HTMLElement {
      @attr foo = 'bar'
      connectedCallback() {
        initializeAttrs(this)
      }
    }
    expect(OuterRegisterAttrsElement).to.exist
    const element = document.createElement('outer-register-attrs')
    document.body.append(element)
    expect(element).to.be.instanceOf(decorated[0])
    expect(element.getAttribute('data-foo')).to.equal('bar')
    element.remove()
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
})
