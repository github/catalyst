import {expect, fixture, html} from '@open-wc/testing'
import {controller} from '../../src/controller.js'
import {attr, defineObservedAttributes, initializeAttrs} from '../../src/attr.js'
import type {CustomElementClass} from '../../src/custom-element.js'

const symbolWithMetadata = Symbol as {metadata?: symbol}
const observed = (classObject: CustomElementClass) => classObject.observedAttributes

describe('Attr (standard decorators)', () => {
  {
    @controller
    class StandardAttrElement extends HTMLElement {
      @attr fooBar = 'hello'
      @attr accessor fooCount = 2
      fooBaz = 1

      #bing = 'world'
      get bingBaz() {
        return this.#bing
      }
      @attr set bingBaz(value: string) {
        this.#bing = value
      }

      @attr get fooFlag() {
        return false
      }
    }

    let instance: StandardAttrElement
    beforeEach(async () => {
      instance = await fixture(html`<standard-attr></standard-attr>`)
    })

    it('does not alter field values from their initial value', () => {
      expect(instance).to.have.property('fooBar', 'hello')
      expect(instance).to.have.property('fooCount', 2)
      expect(instance).to.have.property('fooBaz', 1)
      expect(instance).to.have.property('bingBaz', 'world')
      expect(instance).to.have.property('fooFlag', false)
    })

    it('reflects the initial value as an attribute, if not present', () => {
      expect(instance).to.have.attribute('data-foo-bar', 'hello')
      expect(instance).to.have.attribute('data-foo-count', '2')
      expect(instance).to.not.have.attribute('data-foo-baz')
      expect(instance).to.have.attribute('data-bing-baz', 'world')
      expect(instance).to.not.have.attribute('data-foo-flag')
    })

    it('prioritises the value in the attribute over the property', async () => {
      instance = await fixture(
        html`<standard-attr data-foo-bar="goodbye" data-foo-count="5" data-bing-baz="universe"></standard-attr>`
      )
      expect(instance).to.have.property('fooBar', 'goodbye')
      expect(instance).to.have.property('fooCount', 5)
      expect(instance).to.have.property('bingBaz', 'universe')
    })

    it('changes the property when the attribute changes', () => {
      instance.setAttribute('data-foo-bar', 'goodbye')
      instance.setAttribute('data-foo-count', '7')
      instance.setAttribute('data-foo-flag', '')
      expect(instance).to.have.property('fooBar', 'goodbye')
      expect(instance).to.have.property('fooCount', 7)
      expect(instance).to.have.property('fooFlag', true)
    })

    it('changes the attribute when the property changes', () => {
      instance.fooBar = 'goodbye'
      instance.fooCount = 3
      instance.bingBaz = 'universe'
      expect(instance).to.have.attribute('data-foo-bar', 'goodbye')
      expect(instance).to.have.attribute('data-foo-count', '3')
      expect(instance).to.have.attribute('data-bing-baz', 'universe')
    })

    it('observes the attributes', () => {
      expect(observed(StandardAttrElement)).to.have.members([
        'data-foo-bar',
        'data-foo-count',
        'data-bing-baz',
        'data-foo-flag'
      ])
    })
  }

  it('registers attrs for defineObservedAttributes and initializeAttrs without @controller', async () => {
    class StandardManualAttrElement extends HTMLElement {
      @attr foo = 'bar'
      connectedCallback() {
        initializeAttrs(this)
      }
    }
    defineObservedAttributes(StandardManualAttrElement)
    customElements.define('standard-manual-attr', StandardManualAttrElement)
    expect(observed(StandardManualAttrElement)).to.eql(['data-foo'])

    class StandardInitializeOnlyElement extends HTMLElement {
      @attr foo = 'baz'
      connectedCallback() {
        initializeAttrs(this)
      }
    }
    customElements.define('standard-initialize-only', StandardInitializeOnlyElement)
    const instance = await fixture(html`<standard-initialize-only></standard-initialize-only>`)
    expect(instance.getAttribute('data-foo')).to.equal('baz')
  })

  it('respects a static attrPrefix', async () => {
    @controller
    class StandardPrefixAttrElement extends HTMLElement {
      static attrPrefix = 'foo-'
      @attr URLBar = 'b'
    }
    const instance = await fixture<StandardPrefixAttrElement>(html`<standard-prefix-attr></standard-prefix-attr>`)
    expect(instance).to.have.attribute('foo-url-bar', 'b')
  })

  it('registers attrs from undecorated base classes, base class first', async () => {
    class Base extends HTMLElement {
      @attr baseValue = 'base'
    }
    class Middle extends Base {
      @attr middleValue = 1
    }
    @controller
    class StandardInheritedAttrElement extends Middle {
      @attr ownValue = true
    }
    const instance = await fixture<StandardInheritedAttrElement>(
      html`<standard-inherited-attr></standard-inherited-attr>`
    )
    expect(observed(StandardInheritedAttrElement)).to.eql(['data-base-value', 'data-middle-value', 'data-own-value'])
    expect(instance).to.have.attribute('data-base-value', 'base')
    expect(instance).to.have.attribute('data-middle-value', '1')
    expect(instance).to.have.attribute('data-own-value', '')
  })

  it('inherits attrs from a parent controller without adding to it', async () => {
    @controller
    class StandardParentAttrElement extends HTMLElement {
      @attr parentValue = 'p'
    }
    @controller
    class StandardChildAttrElement extends StandardParentAttrElement {
      @attr childValue = 'c'
    }
    expect(observed(StandardParentAttrElement)).to.eql(['data-parent-value'])
    // Like legacy decorators, the inherited list repeats the parent's attributes.
    expect([...new Set(observed(StandardChildAttrElement))]).to.eql(['data-parent-value', 'data-child-value'])
    const child = await fixture(html`<standard-child-attr></standard-child-attr>`)
    expect(child).to.have.attribute('data-parent-value', 'p')
    expect(child).to.have.attribute('data-child-value', 'c')
  })

  it('keeps attrs of subclasses sharing an undecorated base class separate', () => {
    class SharedBase extends HTMLElement {
      @attr shared = ''
    }
    @controller
    class StandardFirstSiblingElement extends SharedBase {
      @attr first = ''
    }
    @controller
    class StandardSecondSiblingElement extends SharedBase {
      @attr second = ''
    }
    expect(observed(StandardFirstSiblingElement)).to.eql(['data-shared', 'data-first'])
    expect(observed(StandardSecondSiblingElement)).to.eql(['data-shared', 'data-second'])
  })

  it('reads metadata stored under a Symbol.metadata defined after Catalyst loaded', async () => {
    const original = symbolWithMetadata.metadata
    symbolWithMetadata.metadata = Symbol('late metadata')
    try {
      @controller
      class StandardLateMetadataElement extends HTMLElement {
        @attr late = 'yes'
      }
      const instance = await fixture<StandardLateMetadataElement>(
        html`<standard-late-metadata></standard-late-metadata>`
      )
      expect(instance.getAttribute('data-late')).to.equal('yes')
    } finally {
      symbolWithMetadata.metadata = original
    }
  })

  it('throws a clear error without decorator metadata', () => {
    const original = symbolWithMetadata.metadata
    delete symbolWithMetadata.metadata
    try {
      expect(
        () =>
          class extends HTMLElement {
            @attr foo = ''
          }
      ).to.throw(TypeError, '@attr requires decorator metadata')
    } finally {
      symbolWithMetadata.metadata = original
    }
  })

  it('throws for unsupported members', () => {
    const message = '@attr must decorate a public instance field/accessor/getter/setter'
    expect(
      () =>
        class extends HTMLElement {
          // @ts-expect-error static members are not supported
          @attr static foo = ''
        }
    ).to.throw(TypeError, message)
    expect(
      () =>
        class extends HTMLElement {
          // @ts-expect-error private members are not supported
          @attr #foo = ''
        }
    ).to.throw(TypeError, message)
    expect(
      () =>
        class extends HTMLElement {
          // @ts-expect-error methods are not supported
          @attr foo() {
            return ''
          }
        }
    ).to.throw(TypeError, message)
  })
})
