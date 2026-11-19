import {expect, fixture, html} from '@open-wc/testing'
import {controller} from '../../src/controller.js'
import {attr, defineObservedAttributes} from '../../src/attr.js'
import type {CustomElementClass} from '../../src/custom-element.js'

const symbolWithMetadata = Symbol as {metadata?: symbol}
const observed = (classObject: CustomElementClass) => classObject.observedAttributes

// Shared @attr behaviour is in test/attr.ts, which also runs with standard decorators.
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

  it('initializes stored attrs before getter attrs that read them', async () => {
    @controller
    class StandardDependentElement extends HTMLElement {
      @attr base = 'field'
      @attr get derived() {
        return `${this.base}-derived`
      }
    }
    const instance = await fixture<StandardDependentElement>(
      html`<standard-dependent data-base="attribute"></standard-dependent>`
    )
    expect(instance).to.have.attribute('data-derived', 'attribute-derived')
  })

  // A base compiled with standard decorators, extended by a class that registers attrs with legacy-style calls.
  describe('mixed with legacy attrs', () => {
    it('initializes standard base attrs before legacy subclass attrs', async () => {
      class MixedOrderBase extends HTMLElement {
        @attr base = 'field'
      }
      class MixedOrderChild extends MixedOrderBase {
        get derived() {
          return this.base
        }
      }
      attr(MixedOrderChild.prototype, 'derived')
      controller(MixedOrderChild)

      expect(observed(MixedOrderChild)).to.deep.equal(['data-base', 'data-derived'])
      const instance = await fixture(html`<mixed-order-child data-base="attribute"></mixed-order-child>`)
      expect(instance).to.have.attribute('data-derived', 'attribute')
    })

    it('initializes standard stored attrs before legacy attrs on the same class', async () => {
      class MixedSameClass extends HTMLElement {
        @attr base = 'field'
        get derived() {
          return this.base
        }
      }
      attr(MixedSameClass.prototype, 'derived')
      controller(MixedSameClass)

      const instance = await fixture(html`<mixed-same-class data-base="attribute"></mixed-same-class>`)
      expect(instance).to.have.attribute('data-derived', 'attribute')
    })

    for (const registered of [false, true]) {
      it(`initializes an overriding legacy getter after the attrs it reads${
        registered ? ', with a registered base' : ''
      }`, async () => {
        class Base extends HTMLElement {
          @attr get label() {
            return 'base'
          }
        }
        class Child extends Base {
          input = 'field'
          get label() {
            return `${this.input}-label`
          }
        }
        if (registered) defineObservedAttributes(Base)
        attr(Child.prototype, 'input')
        attr(Child.prototype, 'label')
        const name = registered ? 'mixed-override-registered' : 'mixed-override'
        controller(name)(Child)

        const instance = document.createElement(name)
        instance.setAttribute('data-input', 'attribute')
        document.body.append(instance)
        expect(instance).to.have.attribute('data-label', 'attribute-label')
        instance.remove()
      })
    }

    it('initializes legacy base attrs before standard subclass attrs', async () => {
      class MixedLegacyBase extends HTMLElement {
        base = 'field'
      }
      attr(MixedLegacyBase.prototype, 'base')
      @controller
      class MixedLegacyChildElement extends MixedLegacyBase {
        @attr get derived() {
          return `${this.base}-derived`
        }
      }

      const instance = await fixture<MixedLegacyChildElement>(
        html`<mixed-legacy-child data-base="attribute"></mixed-legacy-child>`
      )
      expect(instance.getAttribute('data-derived')).to.equal('attribute-derived')
    })

    it('includes standard base attrs registered after a subclass recorded legacy attrs', async () => {
      class MixedLateBase extends HTMLElement {
        @attr base = ''
      }
      class MixedLateChild extends MixedLateBase {
        child = ''
      }
      attr(MixedLateChild.prototype, 'child')
      defineObservedAttributes(MixedLateBase)
      controller(MixedLateChild)

      const instance = await fixture<MixedLateChild>(html`<mixed-late-child data-base="attribute"></mixed-late-child>`)
      expect(instance).to.have.property('base', 'attribute')
    })
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

  it('reads base class metadata stored before Symbol.metadata changed', async () => {
    const original = symbolWithMetadata.metadata
    class StandardLateBase extends HTMLElement {
      @attr early = 'early'
    }
    symbolWithMetadata.metadata = Symbol('late metadata')
    let instance: HTMLElement
    try {
      @controller
      class StandardLateChildElement extends StandardLateBase {
        @attr late = 'late'
      }
      instance = await fixture<StandardLateChildElement>(html`<standard-late-child></standard-late-child>`)
    } finally {
      symbolWithMetadata.metadata = original
    }
    expect(instance.getAttribute('data-early')).to.equal('early')
    expect(instance.getAttribute('data-late')).to.equal('late')
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
