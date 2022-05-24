import {expect, fixture, html} from '@open-wc/testing'
import {attr, attrable} from '../src/attrable.js'

describe('Attrable', () => {
  {
    @attrable
    class InitializeAttrTest extends HTMLElement {
      @attr fooBar = 'hello'
      fooBaz = 1

      getCount = 0
      setCount = 0
      #bing = 'world'
      get bingBaz() {
        this.getCount += 1
        return this.#bing
      }
      @attr set bingBaz(value: string) {
        this.setCount += 1
        this.#bing = value
      }
    }
    window.customElements.define('initialize-attr-test', InitializeAttrTest)

    let instance: InitializeAttrTest
    beforeEach(async () => {
      instance = await fixture(html`<initialize-attr-test />`)
    })

    it('does not error during creation', () => {
      document.createElement('initialize-attr-test')
    })

    it('does not alter field values from their initial value', () => {
      expect(instance).to.have.property('fooBar', 'hello')
      expect(instance).to.have.property('fooBaz', 1)
      expect(instance).to.have.property('bingBaz', 'world')
    })

    it('does not create attributes based on the initial value', () => {
      expect(instance).to.not.have.attribute('foo-bar')
      expect(instance).to.not.have.attribute('foo-baz')
      expect(instance).to.not.have.attribute('bing-baz')
    })

    it('prioritises the value in the attribute over the property', async () => {
      instance = await fixture(html`<initialize-attr-test foo-bar="goodbye" bing-baz="universe" />`)
      expect(instance).to.have.property('fooBar', 'goodbye')
      expect(instance).to.have.attribute('foo-bar', 'goodbye')
      expect(instance).to.have.property('bingBaz', 'universe')
      expect(instance).to.have.attribute('bing-baz', 'universe')
    })

    it('changes the property when the attribute changes', async () => {
      instance.setAttribute('foo-bar', 'goodbye')
      await Promise.resolve()
      expect(instance).to.have.property('fooBar', 'goodbye')
      instance.setAttribute('bing-baz', 'universe')
      await Promise.resolve()
      expect(instance).to.have.property('bingBaz', 'universe')
    })

    it('resets to the default value when the attribute is removed', async () => {
      instance.setAttribute('foo-bar', 'goodbye')
      expect(instance).to.have.property('fooBar', 'goodbye')
      instance.setAttribute('foo-bar', 'goodbye')
      instance.removeAttribute('foo-bar')
      await Promise.resolve()
      expect(instance).to.have.property('fooBar', 'hello')
    })

    it('changes the attribute when the property changes', async () => {
      instance.fooBar = 'goodbye'
      await Promise.resolve()
      expect(instance).to.have.attribute('foo-bar', 'goodbye')
      instance.bingBaz = 'universe'
      await Promise.resolve()
      expect(instance).to.have.attribute('bing-baz', 'universe')
    })

    it('calls underlying get when retrieving, with no attribute set', async () => {
      instance.getCount = 0
      instance.setCount = 0
      instance.removeAttribute('bing-baz')
      instance.bingBaz
      expect(instance).to.have.property('getCount', 1)
    })

    it('does not overly eagerly call get/set on attribute change', async () => {
      instance.getCount = 0
      instance.setCount = 0
      instance.setAttribute('bing-baz', 'one')
      instance.setAttribute('bing-baz', 'one')
      instance.setAttribute('bing-baz', 'one')
      instance.setAttribute('bing-baz', 'one')
      await Promise.resolve()
      expect(instance).to.have.property('getCount', 0)
      expect(instance).to.have.property('setCount', 4)
    })
  }

  describe('types', () => {
    it('infers number types from property and casts as number always', async () => {
      @attrable
      class NumberAttrTest extends HTMLElement {
        @attr fooBar = 1
      }
      window.customElements.define('number-attr-test', NumberAttrTest)
      const instance = await fixture<NumberAttrTest>(html`<number-attr-test />`)

      expect(instance).to.have.property('fooBar', 1)
      expect(instance).to.not.have.attribute('foo-bar')
      instance.setAttribute('foo-bar', '7')
      await Promise.resolve()
      expect(instance).to.have.property('fooBar', 7)
      instance.setAttribute('foo-bar', '-3.14')
      await Promise.resolve()
      expect(instance).to.have.property('fooBar', -3.14)
      instance.setAttribute('foo-bar', 'Not a Number')
      await Promise.resolve()
      expect(instance).to.have.property('fooBar').satisfy(Number.isNaN)
      instance.fooBar = 3.14
      await Promise.resolve()
      expect(instance.getAttribute('foo-bar')).to.equal('3.14')
      instance.removeAttribute('foo-bar')
      await Promise.resolve()
      expect(instance).to.have.property('fooBar', 1)
    })

    it('infers boolean types from property and uses has/toggleAttribute', async () => {
      @attrable
      class BooleanAttrTest extends HTMLElement {
        @attr fooBar = false
      }
      window.customElements.define('boolean-attr-test', BooleanAttrTest)

      const instance = await fixture<BooleanAttrTest>(html`<boolean-attr-test />`)

      expect(instance).to.have.property('fooBar', false)
      expect(instance).to.not.have.attribute('foo-bar')
      instance.setAttribute('foo-bar', '7')
      await Promise.resolve()
      expect(instance).to.have.property('fooBar', true)
      instance.setAttribute('foo-bar', 'hello')
      await Promise.resolve()
      expect(instance).to.have.property('fooBar', true)
      instance.setAttribute('foo-bar', 'false')
      await Promise.resolve()
      expect(instance).to.have.property('fooBar', true)
      instance.removeAttribute('foo-bar')
      await Promise.resolve()
      expect(instance).to.have.property('fooBar', false)
      instance.fooBar = true
      await Promise.resolve()
      expect(instance).to.have.attribute('foo-bar', '')
      instance.fooBar = false
      await Promise.resolve()
      expect(instance).to.have.property('fooBar', false)
      expect(instance).to.not.have.attribute('foo-bar')
      instance.removeAttribute('foo-bar')
      await Promise.resolve()
      expect(instance).to.have.property('fooBar', false)
      expect(instance).to.not.have.attribute('foo-bar')
    })

    it('defaults to inferring string type for non-boolean non-number types', async () => {
      const regexp = /^a regexp$/
      @attrable
      class RegExpAttrTest extends HTMLElement {
        @attr fooBar = regexp
      }
      window.customElements.define('reg-exp-attr-test', RegExpAttrTest)
      const instance = await fixture<RegExpAttrTest>(html`<reg-exp-attr-test />`)

      expect(instance).to.have.property('fooBar', regexp)
      expect(instance).to.not.have.attribute('foo-bar')
      instance.setAttribute('foo-bar', '/^another$/')
      await Promise.resolve()
      expect(instance).to.have.property('fooBar', '/^another$/')
      instance.removeAttribute('foo-bar')
      await Promise.resolve()
      expect(instance).to.have.property('fooBar', regexp)
      expect(instance).to.not.have.attribute('foo-bar')
    })

    it('uses get logic to retrieve value without attribute set', async () => {
      let n = 0.5
      @attrable
      class SeedValueAttrTest extends HTMLElement {
        @attr
        get seedValue() {
          return n
        }
        set seedValue(newValue: number) {}
      }
      window.customElements.define('seed-value-attr-test', SeedValueAttrTest)
      const instance = await fixture<SeedValueAttrTest>(html`<seed-value-attr-test />`)

      expect(instance).to.have.property('seedValue', 0.5)
      n = 1
      expect(instance).to.have.property('seedValue', 1)
      expect(instance).to.not.have.attribute('seed-value')
      instance.setAttribute('seed-value', '3')
      expect(instance).to.have.property('seedValue', 3)
      instance.seedValue = 8
      await Promise.resolve()
      expect(instance).to.have.attribute('seed-value', '8')
      expect(instance).to.have.property('seedValue', 8)
      n = 17
      instance.removeAttribute('seed-value')
      expect(instance).to.have.property('seedValue', 17)
    })

    it('can derive from internal state', async () => {
      @attrable
      class InternalStateAttrTest extends HTMLElement {
        state = 'b'
        @attr
        get isA(): boolean {
          return this.state === 'a'
        }
        set isA(value: boolean) {
          this.state = value ? 'a' : 'b'
        }
      }
      window.customElements.define('internal-state-attr-test', InternalStateAttrTest)
      const instance = await fixture<InternalStateAttrTest>(html`<internal-state-attr-test />`)

      expect(instance).to.have.property('state', 'b')
      expect(instance).to.have.property('isA', false)
      expect(instance).to.not.have.attribute('is-a', '')
      instance.isA = true
      expect(instance).to.have.property('state', 'a')
      await Promise.resolve()
      expect(instance).to.have.property('state', 'a')
      expect(instance).to.have.property('isA', true)
      expect(instance).to.have.attribute('is-a')
    })

    it('avoids infinite loops', async () => {
      @attrable
      class LoopAttrTest extends HTMLElement {
        count = 0
        @attr
        get fooBar() {
          return ++this.count
        }
        set fooBar(value) {
          this.count += 1
        }
      }
      window.customElements.define('loop-attr-test', LoopAttrTest)
      const instance = await fixture<LoopAttrTest>(html`<loop-attr-test />`)

      expect(instance).to.have.property('fooBar')
      instance.fooBar = 1
      instance.setAttribute('foo-bar', '2')
      instance.fooBar = 3
      instance.setAttribute('foo-bar', '4')
    })
  })

  describe('naming', () => {
    @attrable
    class NamingAttrTest extends HTMLElement {
      @attr fooBarBazBing = 'a'
      @attr URLBar = 'b'
      @attr ClipX = 'c'
    }
    window.customElements.define('naming-attr-test', NamingAttrTest)

    let instance: NamingAttrTest
    beforeEach(async () => {
      instance = await fixture(html`<naming-attr-test />`)
    })

    it('converts camel cased property names to their HTML dasherized equivalents', async () => {
      expect(instance.fooBarBazBing).to.equal('a')
      instance.fooBarBazBing = 'bar'
      await Promise.resolve()
      expect(instance.getAttributeNames()).to.include('foo-bar-baz-bing')
    })

    it('will intuitively dasherize acryonyms', async () => {
      expect(instance.URLBar).to.equal('b')
      instance.URLBar = 'bar'
      await Promise.resolve()
      expect(instance.getAttributeNames()).to.include('url-bar')
    })

    it('dasherizes cap suffixed names correctly', async () => {
      expect(instance.ClipX).to.equal('c')
      instance.ClipX = 'bar'
      await Promise.resolve()
      expect(instance.getAttributeNames()).to.include('clip-x')
    })
  })
})
