import {expect, fixture, html} from '@open-wc/testing'
import {attr} from '../src/attr.js'
import {controller} from '../src/controller.js'

describe('Attrable', () => {
  @controller
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  class InitializeAttrTest extends HTMLElement {
    @attr foo = 'hello'
    bar = 1

    getCount = 0
    setCount = 0
    #baz = 'world'
    get baz() {
      this.getCount += 1
      return this.#baz
    }
    @attr set baz(value: string) {
      this.setCount += 1
      this.#baz = value
    }
  }

  let instance
  beforeEach(async () => {
    instance = await fixture(html`<initialize-attr-test />`)
  })

  it('does not error during creation', () => {
    document.createElement('initialize-attr-test')
  })

  it('does not alter field values from their initial value', () => {
    expect(instance).to.have.property('foo', 'hello')
    expect(instance).to.have.property('bar', 1)
    expect(instance).to.have.property('baz', 'world')
  })

  it('reflects the initial value as an attribute, if not present', () => {
    expect(instance).to.have.attribute('data-foo', 'hello')
    expect(instance).to.not.have.attribute('data-bar')
    expect(instance).to.have.attribute('data-baz', 'world')
  })

  it('prioritises the value in the attribute over the property', async () => {
    instance = await fixture(html`<initialize-attr-test data-foo="goodbye" data-baz="universe" />`)
    expect(instance).to.have.property('foo', 'goodbye')
    expect(instance).to.have.attribute('data-foo', 'goodbye')
    expect(instance).to.have.property('baz', 'universe')
    expect(instance).to.have.attribute('data-baz', 'universe')
  })

  it('changes the property when the attribute changes', async () => {
    instance.setAttribute('data-foo', 'goodbye')
    await Promise.resolve()
    expect(instance).to.have.property('foo', 'goodbye')
    instance.setAttribute('data-baz', 'universe')
    await Promise.resolve()
    expect(instance).to.have.property('baz', 'universe')
  })

  it('resets to the default value when the attribute is removed', async () => {
    instance.setAttribute('data-foo', 'goodbye')
    expect(instance).to.have.property('foo', 'goodbye')
    instance.removeAttribute('data-foo')
    await Promise.resolve()
    expect(instance).to.have.property('foo', 'hello')
  })

  it('changes the attribute when the property changes', () => {
    instance.foo = 'goodbye'
    expect(instance).to.have.attribute('data-foo', 'goodbye')
    instance.baz = 'universe'
    expect(instance).to.have.attribute('data-baz', 'universe')
  })

  it('calls underlying get/set', async () => {
    instance.getCount = 0
    instance.setCount = 0
    instance.baz
    expect(instance).to.have.property('getCount', 1)
    expect(instance).to.have.property('setCount', 0)
    instance.baz = 2
    expect(instance).to.have.property('getCount', 1)
    expect(instance).to.have.property('setCount', 1)
  })

  it('does not overly eagerly call get/set on attribute change', async () => {
    instance.getCount = 0
    instance.setCount = 0
    instance.setAttribute('data-baz', 'one')
    instance.setAttribute('data-baz', 'one')
    instance.setAttribute('data-baz', 'one')
    instance.setAttribute('data-baz', 'one')
    await Promise.resolve()
    expect(instance).to.have.property('getCount', 0)
    expect(instance).to.have.property('setCount', 4)
  })

  describe('types', () => {
    it('infers number types from property and casts as number always', async () => {
      @controller
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class NumberAttrTest extends HTMLElement {
        @attr foo = 1
      }
      instance = await fixture(html`<number-attr-test />`)

      expect(instance).to.have.property('foo', 1)
      expect(instance).to.have.attribute('data-foo', '1')
      instance.setAttribute('data-foo', '7')
      await Promise.resolve()
      expect(instance).to.have.property('foo', 7)
      instance.setAttribute('data-foo', '-3.14')
      await Promise.resolve()
      expect(instance).to.have.property('foo', -3.14)
      instance.setAttribute('data-foo', 'Not a Number')
      await Promise.resolve()
      expect(instance).to.have.property('foo').satisfy(Number.isNaN)
      instance.foo = 3.14
      expect(instance.getAttribute('data-foo')).to.equal('3.14')
      instance.removeAttribute('data-foo')
      await Promise.resolve()
      expect(instance).to.have.property('foo', 1)
    })

    it('infers boolean types from property and uses has/toggleAttribute', async () => {
      @controller
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class BooleanAttrTest extends HTMLElement {
        @attr foo = false
      }

      instance = await fixture(html`<boolean-attr-test />`)

      expect(instance).to.have.property('foo', false)
      expect(instance).to.not.have.attribute('data-foo')
      instance.setAttribute('data-foo', '7')
      await Promise.resolve()
      expect(instance).to.have.property('foo', true)
      instance.setAttribute('data-foo', 'hello')
      await Promise.resolve()
      expect(instance).to.have.property('foo', true)
      instance.setAttribute('data-foo', 'false')
      await Promise.resolve()
      expect(instance).to.have.property('foo', true)
      instance.removeAttribute('data-foo')
      await Promise.resolve()
      expect(instance).to.have.property('foo', false)
      instance.foo = true
      expect(instance).to.have.attribute('data-foo', '')
      instance.foo = false
      expect(instance).to.not.have.attribute('data-foo')
      instance.removeAttribute('data-foo')
      await Promise.resolve()
      expect(instance).to.have.property('foo', false)
    })

    it('defaults to inferring string type for non-boolean non-number types', async () => {
      const regexp = /^a regexp$/
      @controller
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class RegExpAttrTest extends HTMLElement {
        @attr foo = regexp
      }
      instance = await fixture(html`<reg-exp-attr-test />`)

      expect(instance).to.have.property('foo', '/^a regexp$/')
      expect(instance).to.have.attribute('data-foo', '/^a regexp$/')
      instance.setAttribute('data-foo', '/^another$/')
      await Promise.resolve()
      expect(instance).to.have.property('foo', '/^another$/')
      instance.removeAttribute('data-foo')
      await Promise.resolve()
      expect(instance).to.have.property('foo', regexp)
    })

    it('defers to custom set logic if present', async () => {
      const regexp = /^a regexp$/
      @controller
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class RegExpCastAttrTest extends HTMLElement {
        #reg = regexp
        @attr
        get foo() {
          return this.#reg
        }
        set foo(value) {
          this.#reg = value instanceof RegExp ? value : new RegExp(String(value).replace(/^\/|\/$/g, ''))
        }
      }
      instance = await fixture(html`<reg-exp-cast-attr-test />`)

      expect(instance).to.have.property('foo', regexp)
      expect(instance).to.have.attribute('data-foo', '/^a regexp$/')
      instance.setAttribute('data-foo', '/^another$/')
      await Promise.resolve()
      expect(instance).to.have.property('foo').a('regexp').property('source', '^another$')
    })

    it('avoids infinite loops', async () => {
      @controller
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class LoopAttrTest extends HTMLElement {
        count = 0
        @attr
        get foo() {
          return ++this.count
        }
        set foo(value) {
          this.count += 1
        }
      }
      instance = await fixture(html`<loop-attr-test />`)

      expect(instance).to.have.property('foo')
      instance.foo = 1
      instance.setAttribute('data-foo', '2')
      instance.foo = 3
      instance.setAttribute('data-foo', '4')
    })
  })

  describe('naming', () => {
    @controller
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    class NamingAttrTest extends HTMLElement {
      @attr fooBarBazBing = 'a'
      @attr URLBar = 'b'
      @attr ClipX = 'c'
    }

    beforeEach(async () => {
      instance = await fixture(html`<naming-attr-test />`)
    })

    it('converts camel cased property names to their HTML dasherized equivalents', async () => {
      expect(instance.fooBarBazBing).to.equal('a')
      instance.fooBarBazBing = 'bar'
      expect(instance.getAttributeNames()).to.include('data-foo-bar-baz-bing')
    })

    it('will intuitively dasherize acryonyms', async () => {
      expect(instance.URLBar).to.equal('b')
      instance.URLBar = 'bar'
      expect(instance.getAttributeNames()).to.include('data-url-bar')
    })

    it('dasherizes cap suffixed names correctly', async () => {
      expect(instance.ClipX).to.equal('c')
      instance.ClipX = 'bar'
      expect(instance.getAttributeNames()).to.include('data-clip-x')
    })
  })
})
