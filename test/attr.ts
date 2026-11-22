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

  describe('initialization order', () => {
    it('initializes field attrs in declaration order, so their callbacks keep HTML values', async () => {
      @controller
      class CallbackOrderAttrTest extends HTMLElement {
        @attr ready = true
        @attr status = 'default'
        attributeChangedCallback(name: string) {
          if (name === 'data-ready') this.status = 'updated'
        }
      }
      const instance = await fixture<CallbackOrderAttrTest>(
        html`<callback-order-attr-test data-status="html"></callback-order-attr-test>`
      )
      expect(instance).to.have.attribute('data-status', 'html')
    })

    it('initializes field attrs before getter attrs that read them, when both have HTML attributes', async () => {
      @controller
      class ParseOrderAttrTest extends HTMLElement {
        @attr get count() {
          return JSON.parse(this.payload).length
        }
        @attr payload = ''
      }
      const instance = await fixture<ParseOrderAttrTest>(
        html`<parse-order-attr-test data-payload="[1,2]" data-count="7"></parse-order-attr-test>`
      )
      expect(instance).to.have.property('count', 7)
    })

    it('initializes fields named like built-in accessors in declaration order', async () => {
      @controller
      class BuiltinNameAttrTest extends HTMLElement {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore With define semantics TypeScript wants an initializer (TS2612). This tests a field without one.
        @attr title!: string
        @attr status = 'default'
        attributeChangedCallback(name: string) {
          if (name === 'data-title') this.status = 'updated'
        }
      }
      const instance = await fixture<BuiltinNameAttrTest>(
        html`<builtin-name-attr-test data-status="html"></builtin-name-attr-test>`
      )
      expect(instance).to.have.attribute('data-status', 'html')
    })

    it('orders getter attrs by the HTML attributes present after fields initialize', async () => {
      @controller
      class LatePresenceAttrTest extends HTMLElement {
        @attr trigger = true
        @attr get payload() {
          return ''
        }
        @attr get count() {
          return JSON.parse(this.payload).length
        }
        attributeChangedCallback(name: string) {
          if (name === 'data-trigger') this.setAttribute('data-payload', '[1,2]')
        }
      }
      const instance = await fixture<LatePresenceAttrTest>(
        html`<late-presence-attr-test data-count="7"></late-presence-attr-test>`
      )
      expect(instance).to.have.property('count', 7)
    })

    it('initializes fields without a value before getter attrs that read them', async () => {
      @controller
      class UnsetOrderAttrTest extends HTMLElement {
        @attr get greeting() {
          return this.name.toUpperCase()
        }
        @attr name!: string
      }
      const instance = await fixture<UnsetOrderAttrTest>(html`<unset-order-attr-test></unset-order-attr-test>`)
      expect(instance).to.have.attribute('data-greeting', '')
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

    it('initializes getters that read an overridden attr from its HTML value', async () => {
      class ReadOverrideBase extends HTMLElement {
        @attr get label() {
          return 'base'
        }
        @attr get derived() {
          return `${this.label}-derived`
        }
      }
      @controller
      class ReadOverrideAttrTest extends ReadOverrideBase {
        @attr get label() {
          return 'sub'
        }
      }
      const instance = await fixture<ReadOverrideAttrTest>(
        html`<read-override-attr-test data-label="attribute"></read-override-attr-test>`
      )
      expect(instance).to.have.attribute('data-derived', 'attribute-derived')
    })

    it('initializes an overriding getter attr after the attrs it reads', async () => {
      class OverrideBase extends HTMLElement {
        @attr get label() {
          return 'base'
        }
      }
      @controller
      class OverrideGetterAttrTest extends OverrideBase {
        @attr input = 'field'
        @attr get label() {
          return `${this.input}-label`
        }
      }
      const instance = await fixture<OverrideGetterAttrTest>(
        html`<override-getter-attr-test data-input="attribute"></override-getter-attr-test>`
      )
      expect(instance).to.have.attribute('data-label', 'attribute-label')
    })
  })

  it('registers attrs when defineObservedAttributes decorates the class', async () => {
    @controller
    @defineObservedAttributes
    class DecoratedObservedAttrTest extends HTMLElement {
      @attr foo = 'bar'
    }
    expect(observed(DecoratedObservedAttrTest)).to.include('data-foo')
    const instance = await fixture(html`<decorated-observed-attr-test></decorated-observed-attr-test>`)
    expect(instance).to.have.attribute('data-foo', 'bar')
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

    it('leaves built-in element prototypes alone when initializing named attrs', () => {
      const before = Object.getOwnPropertySymbols(HTMLDivElement.prototype).map(String)
      const div = document.createElement('div')
      initializeAttrs(div, ['fooBar'])
      expect(div).to.have.attribute('data-foo-bar', '')
      expect(Object.getOwnPropertySymbols(HTMLDivElement.prototype).map(String)).to.eql(before)
    })

    it('initializes an attr named constructor', () => {
      class ConstructorAttrTest extends HTMLElement {
        connectedCallback() {
          initializeAttrs(this, ['constructor'])
        }
      }
      Object.defineProperty(ConstructorAttrTest.prototype, 'constructor', {configurable: true, get: () => 'default'})
      customElements.define('constructor-attr-test', ConstructorAttrTest)
      const instance = document.createElement('constructor-attr-test')
      document.body.append(instance)
      instance.remove()
      expect(instance).to.have.attribute('data-constructor', 'default')
    })

    // Customized built-ins inherit accessors such as `value` from interfaces like HTMLInputElement. An attr declared
    // without a value has no own property, and the inherited accessor must not make it initialize like a getter attr.
    it('initializes attrs named like accessors of a built-in base element in registration order', function (this: Mocha.Context) {
      const changes: unknown[] = []
      class BuiltinAttrInput extends HTMLInputElement {
        declare value: string
        status = 'idle'
        connectedCallback() {
          initializeAttrs(this)
        }
        attributeChangedCallback(name: string) {
          changes.push([name, this.status])
        }
      }
      attr(BuiltinAttrInput.prototype as unknown as Record<'value', string>, 'value')
      attr(BuiltinAttrInput.prototype as unknown as Record<'status', string>, 'status')
      defineObservedAttributes(BuiltinAttrInput)
      customElements.define('builtin-attr-input', BuiltinAttrInput, {extends: 'input'})
      const element = document.createElement('input', {is: 'builtin-attr-input'})
      // Safari doesn't support customized built-in elements.
      if (!(element instanceof BuiltinAttrInput)) this.skip()
      element.setAttribute('data-status', 'html')
      document.body.append(element)
      element.remove()
      // `value` registers first, so it initializes and reflects before `status` reads its HTML value.
      expect(changes).to.eql([
        ['data-status', 'idle'],
        ['data-value', 'idle']
      ])
    })
  })
})
