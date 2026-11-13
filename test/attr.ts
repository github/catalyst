import {expect, fixture, html} from '@open-wc/testing'
import {controller} from '../src/controller.js'
import {attr, defineObservedAttributes, initializeAttrs} from '../src/attr.js'
import type {CustomElementClass} from '../src/custom-element.js'

const observed = (classObject: CustomElementClass) => classObject.observedAttributes

describe('Attr', () => {
  {
    @controller
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

    it('reflects the initial value as an attribute, if not present', () => {
      expect(instance).to.have.attribute('data-foo-bar', 'hello')
      expect(instance).to.not.have.attribute('data-foo-baz')
      expect(instance).to.have.attribute('data-bing-baz', 'world')
    })

    it('prioritises the value in the attribute over the property', async () => {
      instance = await fixture(html`<initialize-attr-test data-foo-bar="goodbye" data-bing-baz="universe" />`)
      expect(instance).to.have.property('fooBar', 'goodbye')
      expect(instance).to.have.attribute('data-foo-bar', 'goodbye')
      expect(instance).to.have.property('bingBaz', 'universe')
      expect(instance).to.have.attribute('data-bing-baz', 'universe')
    })

    it('changes the property when the attribute changes', async () => {
      instance.setAttribute('data-foo-bar', 'goodbye')
      await Promise.resolve()
      expect(instance).to.have.property('fooBar', 'goodbye')
      instance.setAttribute('data-bing-baz', 'universe')
      await Promise.resolve()
      expect(instance).to.have.property('bingBaz', 'universe')
    })

    it('changes the attribute when the property changes', () => {
      instance.fooBar = 'goodbye'
      expect(instance).to.have.attribute('data-foo-bar', 'goodbye')
      instance.bingBaz = 'universe'
      expect(instance).to.have.attribute('data-bing-baz', 'universe')
    })
  }

  describe('types', () => {
    it('infers boolean types from property and uses has/toggleAttribute', async () => {
      @controller
      class BooleanAttrTest extends HTMLElement {
        @attr fooBar = false
      }

      const instance = await fixture<BooleanAttrTest>(html`<boolean-attr-test />`)

      expect(instance).to.have.property('fooBar', false)
      expect(instance).to.not.have.attribute('data-foo-bar')
      instance.setAttribute('data-foo-bar', '7')
      await Promise.resolve()
      expect(instance).to.have.property('fooBar', true)
      instance.setAttribute('data-foo-bar', 'hello')
      await Promise.resolve()
      expect(instance).to.have.property('fooBar', true)
      instance.setAttribute('data-foo-bar', 'false')
      await Promise.resolve()
      expect(instance).to.have.property('fooBar', true)
      instance.removeAttribute('data-foo-bar')
      await Promise.resolve()
      expect(instance).to.have.property('fooBar', false)
      instance.fooBar = true
      await Promise.resolve()
      expect(instance).to.have.attribute('data-foo-bar', '')
      instance.fooBar = false
      await Promise.resolve()
      expect(instance).to.not.have.attribute('data-foo-bar')
      instance.removeAttribute('data-foo-bar')
      await Promise.resolve()
      expect(instance).to.have.property('fooBar', false)
    })

    it('avoids infinite loops', async () => {
      @controller
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

      const instance = await fixture<LoopAttrTest>(html`<loop-attr-test />`)

      expect(instance).to.have.property('fooBar')
      instance.fooBar = 1
      instance.setAttribute('data-foo-bar', '2')
      instance.fooBar = 3
      instance.setAttribute('data-foo-bar', '4')
    })
  })

  describe('naming', () => {
    @controller
    class NamingAttrTest extends HTMLElement {
      @attr fooBarBazBing = 'a'
      @attr URLBar = 'b'
      @attr ClipX = 'c'
    }

    let instance: NamingAttrTest
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

  describe('prefix', () => {
    @controller
    class PrefixAttrTest extends HTMLElement {
      static attrPrefix = 'foo-'
      @attr fooBarBazBing = 'a'
      @attr URLBar = 'b'
      @attr ClipX = 'c'
    }

    let instance: PrefixAttrTest
    beforeEach(async () => {
      instance = await fixture(html`<prefix-attr-test />`)
    })

    it('respects custom attrPrefix static member', async () => {
      expect(instance.getAttributeNames()).to.include('foo-foo-bar-baz-bing')
      expect(instance.getAttributeNames()).to.include('foo-url-bar')
      expect(instance.getAttributeNames()).to.include('foo-clip-x')
    })
  })

  describe('inheritance', () => {
    it('registers attrs from undecorated base classes, base class first', async () => {
      class Base extends HTMLElement {
        @attr baseValue = 'base'
      }
      class Middle extends Base {
        @attr middleValue = 1
      }
      @controller
      class InheritedAttrTest extends Middle {
        @attr ownValue = true
      }
      const instance = await fixture<InheritedAttrTest>(html`<inherited-attr-test></inherited-attr-test>`)
      expect(observed(InheritedAttrTest)).to.eql(['data-base-value', 'data-middle-value', 'data-own-value'])
      expect(instance).to.have.attribute('data-base-value', 'base')
      expect(instance).to.have.attribute('data-middle-value', '1')
      expect(instance).to.have.attribute('data-own-value', '')
    })

    it('inherits attrs from a parent controller without adding to it', async () => {
      @controller
      class ParentAttrTest extends HTMLElement {
        @attr parentValue = 'p'
      }
      @controller
      class ChildAttrTest extends ParentAttrTest {
        @attr childValue = 'c'
      }
      expect(observed(ParentAttrTest)).to.eql(['data-parent-value'])
      // The inherited list repeats the parent's attributes.
      expect([...new Set(observed(ChildAttrTest))]).to.eql(['data-parent-value', 'data-child-value'])
      const child = await fixture(html`<child-attr-test></child-attr-test>`)
      expect(child).to.have.attribute('data-parent-value', 'p')
      expect(child).to.have.attribute('data-child-value', 'c')
    })

    it('keeps attrs of subclasses sharing an undecorated base class separate', () => {
      class SharedBase extends HTMLElement {
        @attr shared = ''
      }
      @controller
      class FirstSiblingAttrTest extends SharedBase {
        @attr first = ''
      }
      @controller
      class SecondSiblingAttrTest extends SharedBase {
        @attr second = ''
      }
      expect(observed(FirstSiblingAttrTest)).to.eql(['data-shared', 'data-first'])
      expect(observed(SecondSiblingAttrTest)).to.eql(['data-shared', 'data-second'])
    })
  })

  describe('without @controller', () => {
    it('registers attrs for defineObservedAttributes and initializeAttrs', async () => {
      class ManualAttrTest extends HTMLElement {
        @attr foo = 'bar'
        connectedCallback() {
          initializeAttrs(this)
        }
      }
      defineObservedAttributes(ManualAttrTest)
      customElements.define('manual-attr-test', ManualAttrTest)
      expect(observed(ManualAttrTest)).to.eql(['data-foo'])

      class InitializeOnlyAttrTest extends HTMLElement {
        @attr foo = 'baz'
        connectedCallback() {
          initializeAttrs(this)
        }
      }
      customElements.define('initialize-only-attr-test', InitializeOnlyAttrTest)
      const instance = await fixture(html`<initialize-only-attr-test></initialize-only-attr-test>`)
      expect(instance).to.have.attribute('data-foo', 'baz')
    })
  })
})
