import {expect, fixture, html} from '@open-wc/testing'
import {controller} from '../src/controller.js'
import {attr} from '../src/attr.js'

describe('Attr', () => {
  @controller
  class InitializeAttrTest extends HTMLElement {
    @attr foo = 'hello'
    bar = 1
  }

  let instance
  beforeEach(async () => {
    instance = await fixture(html`<initialize-attr-test />`)
  })

  it('does not error during creation', () => {
    document.createElement('initialize-attr-test')
  })

  it('marks attrs as observedAttributes', () => {
    expect(InitializeAttrTest.observedAttributes).to.eql(['data-foo'])
  })

  it('creates a getter/setter pair for each given attr name', () => {
    expect(instance.foo).to.equal('hello')
    expect(instance).to.have.ownPropertyDescriptor('foo')
  })

  it('sets the attribute to a previously defined value on the key', () => {
    expect(instance.foo).to.equal('hello')
    expect(instance.getAttributeNames()).to.include('data-foo')
    expect(instance.getAttribute('data-foo')).to.equal('hello')
  })

  it('reflects the `data-*` attribute name of the given key', () => {
    expect(instance.foo).to.equal('hello')
    instance.foo = 'bar'
    expect(instance.getAttributeNames()).to.include('data-foo')
    expect(instance.getAttribute('data-foo')).to.equal('bar')
    instance.setAttribute('data-foo', 'baz')
    expect(instance.foo).to.equal('baz')
  })

  it('sets the attribute to a previously defined value on the key', () => {
    instance.foo = 'hello'
    expect(instance.foo).to.equal('hello')
    expect(instance.getAttributeNames()).to.include('data-foo')
    expect(instance.getAttribute('data-foo')).to.equal('hello')
  })

  it('prioritises the value in the attribute over the property', async () => {
    instance = await fixture(html`<initialize-attr-test data-foo="goodbye" />`)
    expect(instance.foo).to.equal('goodbye')
    expect(instance.getAttributeNames()).to.include('data-foo')
    expect(instance.getAttribute('data-foo')).to.equal('goodbye')
  })

  describe('types', () => {
    it('infers number types from property and casts as number always', async () => {
      @controller
      class NumberAttrTest extends HTMLElement {
        @attr foo = 1
      }
      expect(NumberAttrTest).to.have.property('observedAttributes').include('data-foo')
      instance = await fixture(html`<number-attr-test />`)
      expect(instance.foo).to.equal(1)
      expect(instance.getAttributeNames()).to.include('data-foo')
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

    it('infers boolean types from property and uses has/toggleAttribute', async () => {
      @controller
      class BooleanAttrTest extends HTMLElement {
        @attr foo = false
      }
      expect(BooleanAttrTest).to.have.property('observedAttributes').include('data-foo')
      instance = await fixture(html`<boolean-attr-test />`)
      expect(instance.foo).to.equal(false)
      expect(instance.getAttributeNames()).to.not.include('data-foo')
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
      expect(instance.getAttributeNames()).to.include('data-foo')
      expect(instance.getAttribute('data-foo')).to.equal('')
      instance.foo = false
      expect(instance.getAttributeNames()).to.not.include('data-foo')
    })

    it('defaults to inferring string type for non-boolean non-number types', async () => {
      @controller
      class RegExpAttrTest extends HTMLElement {
        @attr foo = /^a regexp$/
      }
      expect(RegExpAttrTest).to.have.property('observedAttributes').include('data-foo')
      instance = await fixture(html`<reg-exp-attr-test />`)
      expect(instance.foo).to.equal('/^a regexp$/')
      expect(instance.getAttributeNames()).to.include('data-foo')
      expect(instance.getAttribute('data-foo')).to.equal('/^a regexp$/')
    })
  })

  describe('naming', () => {
    @controller
    class NamingAttrTest extends HTMLElement {
      @attr fooBarBazBing = 'a'
      @attr URLBar = 'b'
      @attr ClipX = 'c'
    }

    beforeEach(async () => {
      instance = await fixture(html`<naming-attr-test />`)
    })

    it('converts camel cased property names to their HTML dasherized equivalents', async () => {
      expect(NamingAttrTest).to.have.property('observedAttributes').include('data-foo-bar-baz-bing')
      expect(instance.fooBarBazBing).to.equal('a')
      instance.fooBarBazBing = 'bar'
      expect(instance.getAttributeNames()).to.include('data-foo-bar-baz-bing')
    })

    it('will intuitively dasherize acryonyms', async () => {
      expect(NamingAttrTest).to.have.property('observedAttributes').include('data-url-bar')
      expect(instance.URLBar).to.equal('b')
      instance.URLBar = 'bar'
      expect(instance.getAttributeNames()).to.include('data-url-bar')
    })

    it('dasherizes cap suffixed names correctly', async () => {
      expect(NamingAttrTest).to.have.property('observedAttributes').include('data-clip-x')
      expect(instance.ClipX).to.equal('c')
      instance.ClipX = 'bar'
      expect(instance.getAttributeNames()).to.include('data-clip-x')
    })
  })
})
