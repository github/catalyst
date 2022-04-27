import {expect} from '@open-wc/testing'
import {initializeAttrs, defineObservedAttributes, attr} from '../lib/attr.js'

describe('initializeAttrs', () => {
  class InitializeAttrTestElement extends HTMLElement {}
  window.customElements.define('initialize-attr-test-element', InitializeAttrTestElement)

  it('creates a getter/setter pair for each given attr name', () => {
    const instance = document.createElement('initialize-attr-test-element')
    expect(instance).to.not.have.ownPropertyDescriptor('foo')
    initializeAttrs(instance, ['foo'])
    expect(instance).to.have.ownPropertyDescriptor('foo')
  })

  it('reflects the `data-*` attribute name of the given key', () => {
    const instance = document.createElement('initialize-attr-test-element')
    initializeAttrs(instance, ['foo'])
    expect(instance.foo).to.equal('')
    instance.foo = 'bar'
    expect(instance.getAttributeNames()).to.eql(['data-foo'])
    expect(instance.getAttribute('data-foo')).to.equal('bar')
    instance.setAttribute('data-foo', 'baz')
    expect(instance.foo).to.equal('baz')
  })

  it('sets the attribute to a previously defined value on the key', () => {
    const instance = document.createElement('initialize-attr-test-element')
    instance.foo = 'hello'
    initializeAttrs(instance, ['foo'])
    expect(instance.foo).to.equal('hello')
    expect(instance.getAttributeNames()).to.eql(['data-foo'])
    expect(instance.getAttribute('data-foo')).to.equal('hello')
  })

  it('prioritises the value in the attribute over the property', () => {
    const instance = document.createElement('initialize-attr-test-element')
    instance.foo = 'goodbye'
    instance.setAttribute('data-foo', 'hello')
    initializeAttrs(instance, ['foo'])
    expect(instance.foo).to.equal('hello')
    expect(instance.getAttributeNames()).to.eql(['data-foo'])
    expect(instance.getAttribute('data-foo')).to.equal('hello')
  })

  describe('types', () => {
    it('infers number types from property and casts as number always', () => {
      const instance = document.createElement('initialize-attr-test-element')
      instance.foo = 1
      initializeAttrs(instance, ['foo'])
      expect(instance.foo).to.equal(1)
      expect(instance.getAttributeNames()).to.eql(['data-foo'])
      expect(instance.getAttribute('data-foo')).to.equal('1')
      instance.setAttribute('data-foo', '7')
      expect(instance.foo).to.equal(7)
      instance.setAttribute('data-foo', '-3.14')
      expect(instance.foo).to.equal(-3.14)
      instance.setAttribute('data-foo', 'Not a Number')
      expect(Number.isNaN(instance.foo)).to.equal(true)
      instance.removeAttribute('data-foo')
      expect(instance.foo).to.equal(0)
      instance.foo = 3.14
      expect(instance.getAttribute('data-foo')).to.equal('3.14')
    })

    it('infers boolean types from property and uses has/toggleAttribute', () => {
      const instance = document.createElement('initialize-attr-test-element')
      instance.foo = false
      initializeAttrs(instance, ['foo'])
      expect(instance.foo).to.equal(false)
      expect(instance.getAttributeNames()).to.eql([])
      expect(instance.getAttribute('data-foo')).to.equal(null)
      instance.setAttribute('data-foo', '7')
      expect(instance.foo).to.equal(true)
      instance.setAttribute('data-foo', 'hello')
      expect(instance.foo).to.equal(true)
      instance.setAttribute('data-foo', 'false')
      expect(instance.foo).to.equal(true)
      instance.removeAttribute('data-foo')
      expect(instance.foo).to.equal(false)
      instance.foo = '1'
      expect(instance.foo).to.equal(true)
      expect(instance.getAttributeNames()).to.eql(['data-foo'])
      expect(instance.getAttribute('data-foo')).to.equal('')
      instance.foo = false
      expect(instance.getAttributeNames()).to.eql([])
    })

    it('defaults to inferring string type for non-boolean non-number types', () => {
      const instance = document.createElement('initialize-attr-test-element')
      instance.foo = /^a regexp$/
      initializeAttrs(instance, ['foo'])
      expect(instance.foo).to.equal('/^a regexp$/')
      expect(instance.getAttributeNames()).to.eql(['data-foo'])
      expect(instance.getAttribute('data-foo')).to.equal('/^a regexp$/')
    })
  })

  describe('naming', () => {
    it('converts camel cased property names to their HTML dasherized equivalents', () => {
      const instance = document.createElement('initialize-attr-test-element')
      initializeAttrs(instance, ['fooBarBazBing'])
      expect(instance.fooBarBazBing).to.equal('')
      instance.fooBarBazBing = 'bar'
      expect(instance.getAttributeNames()).to.eql(['data-foo-bar-baz-bing'])
    })

    it('will intuitively dasherize acryonyms', () => {
      const instance = document.createElement('initialize-attr-test-element')
      initializeAttrs(instance, ['URLBar'])
      expect(instance.URLBar).to.equal('')
      instance.URLBar = 'bar'
      expect(instance.getAttributeNames()).to.eql(['data-url-bar'])
    })

    it('dasherizes cap suffixed names correctly', () => {
      const instance = document.createElement('initialize-attr-test-element')
      initializeAttrs(instance, ['ClipX'])
      expect(instance.ClipX).to.equal('')
      instance.ClipX = 'bar'
      expect(instance.getAttributeNames()).to.eql(['data-clip-x'])
    })
  })

  describe('class fields', () => {
    class ClassFieldAttrTestElement extends HTMLElement {
      foo = 1
    }
    customElements.define('class-field-attr-test-element', ClassFieldAttrTestElement)

    it('overrides any getters assigned in constructor (like class fields)', () => {
      const instance = document.createElement('class-field-attr-test-element')
      initializeAttrs(instance, ['foo'])
      instance.foo = 2
      expect(instance.foo).to.equal(2)
      expect(instance.getAttribute('data-foo')).to.equal('2')
      instance.setAttribute('data-foo', '3')
      expect(instance.foo).to.equal(3)
    })

    it('defaults to class field value attribute not present', () => {
      const instance = document.createElement('class-field-attr-test-element')
      initializeAttrs(instance, ['foo'])
      expect(instance.foo).to.equal(1)
      expect(instance.getAttribute('data-foo')).to.equal('1')
    })

    it('ignores class field value if element has attribute already', () => {
      const instance = document.createElement('class-field-attr-test-element')
      instance.setAttribute('data-foo', '2')
      initializeAttrs(instance, ['foo'])
      expect(instance.foo).to.equal(2)
      expect(instance.getAttribute('data-foo')).to.equal('2')
    })
  })
})

describe('attr', () => {
  class AttrTestElement extends HTMLElement {
    @attr foo
    @attr bar
  }
  window.customElements.define('attr-test-element', AttrTestElement)

  class ExtendedAttrTestElement extends AttrTestElement {
    @attr baz
  }
  window.customElements.define('extended-attr-test-element', ExtendedAttrTestElement)

  it('populates the "default" list for initializeAttrs', () => {
    const instance = document.createElement('attr-test-element')
    instance.foo = 'hello'
    initializeAttrs(instance)
    expect(instance).to.have.property('foo', 'hello')
    expect(instance).to.have.property('bar', '')
    expect(instance.getAttributeNames()).to.eql(['data-foo', 'data-bar'])
    expect(instance.getAttribute('data-foo')).to.equal('hello')
    expect(instance.getAttribute('data-bar')).to.equal('')
  })

  it('includes attrs from extended elements', () => {
    const instance = document.createElement('extended-attr-test-element')
    instance.bar = 'hello'
    instance.baz = 'world'
    initializeAttrs(instance)
    expect(instance).to.have.property('foo', '')
    expect(instance).to.have.property('bar', 'hello')
    expect(instance).to.have.property('baz', 'world')
    expect(instance.getAttributeNames()).to.eql(['data-foo', 'data-bar', 'data-baz'])
    expect(instance.getAttribute('data-foo')).to.equal('')
    expect(instance.getAttribute('data-bar')).to.equal('hello')
    expect(instance.getAttribute('data-baz')).to.equal('world')
  })

  it('can be initialized multiple times without error', () => {
    const instance = document.createElement('initialize-attr-test-element')
    expect(instance).to.not.have.ownPropertyDescriptor('foo')
    initializeAttrs(instance, ['foo'])
    expect(instance).to.have.ownPropertyDescriptor('foo')
    initializeAttrs(instance, ['foo'])
  })
})

describe('defineObservedAttributes', () => {
  it('defines `observedAttributes` getter/setter on class', () => {
    class TestElement extends HTMLElement {}
    defineObservedAttributes(TestElement)
    expect(TestElement).to.have.ownPropertyDescriptor('observedAttributes')
    expect(TestElement.observedAttributes).to.eql([])
  })

  it('can be set after definition', () => {
    class TestElement extends HTMLElement {}
    defineObservedAttributes(TestElement)
    TestElement.observedAttributes = ['a', 'b', 'c']
    expect(TestElement.observedAttributes).to.eql(['a', 'b', 'c'])
  })

  it('will reflect values from attr calls', () => {
    class TestElement extends HTMLElement {
      @attr foo
    }
    defineObservedAttributes(TestElement)
    expect(TestElement.observedAttributes).to.eql(['data-foo'])
  })

  it('will reflect values even if set after definition', () => {
    class TestElement extends HTMLElement {
      @attr foo
    }
    defineObservedAttributes(TestElement)
    TestElement.observedAttributes = ['a', 'b', 'c']
    expect(TestElement.observedAttributes).to.eql(['data-foo', 'a', 'b', 'c'])
  })

  it('will reflect values from extended elements', () => {
    class TestElement extends HTMLElement {
      @attr foo
    }
    class ExtendedTestElement extends TestElement {}
    defineObservedAttributes(ExtendedTestElement)
    expect(ExtendedTestElement.observedAttributes).to.eql(['data-foo'])
  })
})
