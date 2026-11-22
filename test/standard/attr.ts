import {expect, fixture, html} from '@open-wc/testing'
import {controller} from '../../src/controller.js'
import {attr, defineObservedAttributes, initializeAttrs} from '../../src/attr.js'
import type {CustomElementClass} from '../../src/custom-element.js'
import type {ClassContext} from '../../src/decorator-context.js'
import {register} from '../../src/register.js'

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

  // Standard decorators apply accessor decorators before field decorators, so accessors register first.
  it('registers accessor attrs before field attrs declared above them', () => {
    @controller
    class StandardRegistrationOrderElement extends HTMLElement {
      @attr first = ''
      @attr accessor second = ''
    }
    expect(observed(StandardRegistrationOrderElement)).to.eql(['data-second', 'data-first'])
  })

  // Setting a missing attr's attribute can run connectedCallback before the rest initialize, so the order is observable.
  it('initializes accessor attrs in registration order, like fields, even when wrapped or overriding a getter', async () => {
    const seen: Record<string, unknown[]> = {field: [], accessor: [], wrapped: [], override: []}
    const wrap = <This, Value>(value: ClassAccessorDecoratorTarget<This, Value>) => ({
      get(this: This) {
        return value.get.call(this)
      },
      set(this: This, newValue: Value) {
        value.set.call(this, newValue)
      }
    })
    @controller
    class FieldOrderElement extends HTMLElement {
      @attr first = ''
      @attr second = ''
      connectedCallback() {
        seen.field!.push(this.second)
      }
    }
    @controller
    class AccessorOrderElement extends HTMLElement {
      @attr accessor first = ''
      @attr accessor second = ''
      connectedCallback() {
        seen.accessor!.push(this.second)
      }
    }
    @controller
    class WrappedOrderElement extends HTMLElement {
      @wrap @attr accessor first = ''
      @attr accessor second = ''
      connectedCallback() {
        seen.wrapped!.push(this.second)
      }
    }
    class GetterBase extends HTMLElement {
      @attr get first() {
        return ''
      }
    }
    @controller
    class OverrideOrderElement extends GetterBase {
      @attr override accessor first = ''
      @attr accessor second = ''
      connectedCallback() {
        seen.override!.push(this.second)
      }
    }
    expect(FieldOrderElement).to.exist
    expect(AccessorOrderElement).to.exist
    expect(WrappedOrderElement).to.exist
    expect(OverrideOrderElement).to.exist
    const container = await fixture(html`<div></div>`)
    // Elements from an inert document upgrade when inserted, with their attributes already set, as innerHTML does.
    const inert = document.implementation.createHTMLDocument()
    for (const tag of ['field-order', 'accessor-order', 'wrapped-order', 'override-order']) {
      const element = inert.createElement(tag)
      element.setAttribute('data-second', 'html')
      container.append(document.adoptNode(element))
    }
    expect(seen.field).to.have.length(1)
    expect(seen.accessor).to.eql(seen.field)
    expect(seen.wrapped).to.eql(seen.field)
    expect(seen.override).to.eql(seen.field)
  })

  // Undecorated auto-accessors have no metadata recording that they store a value, but they have a setter, which
  // computed getter attrs don't, so they initialize in registration order as in v1.8.1.
  for (const registration of ['attr calls', 'explicit names'] as const) {
    it(`initializes undecorated accessors registered by ${registration} in registration order`, () => {
      class UndecoratedAccessorElement extends HTMLElement {
        static observedAttributes = ['data-ready']
        accessor ready = true
        accessor status = 'default'
        connectedCallback() {
          if (registration === 'explicit names') initializeAttrs(this, ['ready', 'status'])
          else initializeAttrs(this)
        }
        attributeChangedCallback() {
          this.status = 'updated'
        }
      }
      if (registration === 'attr calls') {
        attr(UndecoratedAccessorElement.prototype, 'ready')
        attr(UndecoratedAccessorElement.prototype, 'status')
      }
      const tag = `undecorated-accessor-${registration.replace(' ', '-')}`
      customElements.define(tag, UndecoratedAccessorElement)
      const element = document.createElement(tag) as UndecoratedAccessorElement
      element.setAttribute('data-status', 'html')
      document.body.append(element)
      element.remove()
      expect(element.status).to.equal('html')
    })
  }

  it('initializes explicitly named accessor attrs in the order given, like fields', () => {
    class ExplicitNamesElement extends HTMLElement {
      static observedAttributes = ['data-ready']
      @attr accessor ready = true
      @attr accessor status = 'default'
      connectedCallback() {
        initializeAttrs(this, ['ready', 'status'])
      }
      attributeChangedCallback() {
        this.status = 'updated'
      }
    }
    customElements.define('explicit-names-element', ExplicitNamesElement)
    const element = document.createElement('explicit-names-element') as ExplicitNamesElement
    element.setAttribute('data-status', 'html')
    document.body.append(element)
    element.remove()
    // `ready` initializes first, so its callback runs before `status` reads its HTML value.
    expect(element.status).to.equal('html')
  })

  it('initializes getters that read a decorated getter and setter pair from its HTML value', async () => {
    @controller
    class StandardPairElement extends HTMLElement {
      #name = 'field'
      @attr get name() {
        return this.#name
      }
      @attr get greeting() {
        return `hi ${this.name}`
      }
      // eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
      @attr set name(value: string) {
        this.#name = value
      }
    }
    const instance = await fixture<StandardPairElement>(html`<standard-pair data-name="attribute"></standard-pair>`)
    expect(instance).to.have.attribute('data-greeting', 'hi attribute')
  })

  // esbuild's `addInitializer` returns a value, and it throws if a class decorator returns anything but a function.
  it('returns nothing from class decorators, whatever addInitializer returns', () => {
    class ReturnCheckElement extends HTMLElement {}
    const context: ClassContext<typeof ReturnCheckElement> = {
      kind: 'class',
      name: 'ReturnCheckElement',
      addInitializer: () => 1
    }
    expect(defineObservedAttributes(ReturnCheckElement, context)).to.equal(undefined)
    expect(controller(ReturnCheckElement, context)).to.equal(undefined)
    expect(controller('return-check')(ReturnCheckElement, context)).to.equal(undefined)
    expect(register(ReturnCheckElement, context)).to.equal(undefined)
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

    it('initializes a legacy getter overriding a standard accessor attr after the attrs it reads', async () => {
      class Base extends HTMLElement {
        @attr accessor label = 'base'
      }
      class Child extends Base {
        input = 'field'
        // A getter without a setter computes its value, so it initializes after the attrs it reads.
        override get label() {
          return `${this.input}-label`
        }
      }
      attr(Child.prototype, 'input')
      attr(Child.prototype, 'label')
      controller('mixed-accessor-override')(Child)

      const instance = document.createElement('mixed-accessor-override')
      instance.setAttribute('data-input', 'attribute')
      document.body.append(instance)
      expect(instance).to.have.attribute('data-label', 'attribute-label')
      instance.remove()
    })

    it('initializes standard fields before legacy fields registered later on the same class', async () => {
      class MixedCallbackOrder extends HTMLElement {
        @attr ready = true
        status = 'default'
        attributeChangedCallback(name: string) {
          if (name === 'data-ready') this.status = 'updated'
        }
      }
      attr(MixedCallbackOrder.prototype, 'status')
      controller(MixedCallbackOrder)

      const instance = await fixture(html`<mixed-callback-order data-status="html"></mixed-callback-order>`)
      expect(instance).to.have.attribute('data-status', 'html')
    })

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

  // Code can set properties on an element before it upgrades, such as a clone of inert template content. A field
  // without a value replaces a legacy `declare` field, which emitted nothing, so it keeps those values.
  it('keeps values set before upgrade on fields without a value, as legacy declare fields did', async () => {
    @controller
    class PreUpgradeElement extends HTMLElement {
      @attr runner!: string
      @attr cost!: number
      @attr label = 'default'
    }
    expect(PreUpgradeElement).to.exist
    const template = document.createElement('template')
    template.content.append(template.content.ownerDocument.createElement('pre-upgrade'))
    const element = template.content.firstElementChild!.cloneNode() as PreUpgradeElement
    expect(element).not.to.be.instanceOf(PreUpgradeElement)
    Object.assign(element, {runner: 'Linux 2-core', cost: 800, label: 'set before upgrade'})
    const container = await fixture(html`<div></div>`)
    container.append(element)
    expect(element).to.be.instanceOf(PreUpgradeElement)
    expect(element.runner).to.equal('Linux 2-core')
    expect(element.cost).to.equal(800)
    expect(element).to.have.attribute('data-runner', 'Linux 2-core')
    expect(element).to.have.attribute('data-cost', '800')
    // A field with a value replaces it, as with legacy decorators.
    expect(element.label).to.equal('default')
  })

  // Another class decorator can call defineObservedAttributes before the class's metadata is attached.
  it('registers standard attrs that an earlier defineObservedAttributes call missed', async () => {
    const early = (classObject: CustomElementClass) => defineObservedAttributes(classObject)
    @controller
    @early
    class EarlyObservedElement extends HTMLElement {
      @attr value = 'default'
    }
    expect(observed(EarlyObservedElement)).to.include('data-value')
    const instance = await fixture(html`<early-observed></early-observed>`)
    expect(instance).to.have.attribute('data-value', 'default')
  })

  it('registers standard attrs of a subclass that an earlier call missed, when its base has some', async () => {
    const early = (classObject: CustomElementClass) => defineObservedAttributes(classObject)
    class EarlyBase extends HTMLElement {
      @attr base = 'base'
    }
    @controller
    @early
    class EarlyChildElement extends EarlyBase {
      @attr child = 'child'
    }
    expect(observed(EarlyChildElement)).to.include.members(['data-base', 'data-child'])
    const instance = await fixture(html`<early-child data-child="html"></early-child>`)
    expect((instance as EarlyChildElement).child).to.equal('html')
    expect(instance).to.have.attribute('data-base', 'base')
  })

  it('registers standard attrs of a base registered before its metadata was attached', async () => {
    const early = (classObject: CustomElementClass) => defineObservedAttributes(classObject)
    @early
    class EarlyRegisteredBase extends HTMLElement {
      @attr base = 'base'
    }
    @controller
    class EarlyBaseChildElement extends EarlyRegisteredBase {
      @attr child = 'child'
    }
    expect(observed(EarlyBaseChildElement)).to.include.members(['data-base', 'data-child'])
    const instance = await fixture(html`<early-base-child></early-base-child>`)
    expect(instance).to.have.attribute('data-base', 'base')
    expect(instance).to.have.attribute('data-child', 'child')
  })

  it('records subclass attrs when the base class metadata is frozen', async () => {
    const freeze = (_: unknown, context: ClassDecoratorContext) => void Object.freeze(context.metadata)
    @freeze
    class FrozenMetadataBase extends HTMLElement {
      @attr base = 'base'
    }
    @controller
    class FrozenMetadataChildElement extends FrozenMetadataBase {
      @attr child = 'child'
    }
    expect(observed(FrozenMetadataChildElement)).to.eql(['data-base', 'data-child'])
    const instance = await fixture(html`<frozen-metadata-child></frozen-metadata-child>`)
    expect(instance).to.have.attribute('data-base', 'base')
    expect(instance).to.have.attribute('data-child', 'child')
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

  it('throws when a class decorator decorates a member', () => {
    for (const [decorator, name] of [
      [controller, 'controller'],
      [register, 'register'],
      [defineObservedAttributes, 'defineObservedAttributes']
    ] as const) {
      expect(
        () =>
          class extends HTMLElement {
            // @ts-expect-error class decorators can't decorate methods
            @decorator foo() {}
          }
      ).to.throw(TypeError, `@${name} must decorate a class`)
    }
  })
})
