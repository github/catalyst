import {expect, fixture, html} from '@open-wc/testing'
import {fake} from 'sinon'
import {provide, consume, providable, ContextEvent} from '../src/providable.js'

describe('Providable', () => {
  const sym = Symbol('bing')
  @providable
  class ProvidableProviderTest extends HTMLElement {
    @provide foo = 'hello'
    @provide bar = 'world'
    @provide get baz() {
      return 3
    }
    @provide [sym] = {provided: true}
    @provide qux = 8
  }
  window.customElements.define('providable-provider-test', ProvidableProviderTest)

  @providable
  class ProvidableConsumerTest extends HTMLElement {
    @consume foo = 'goodbye'
    @consume bar = 'universe'
    @consume get baz() {
      return 1
    }
    @consume [sym] = {}
    count = 0
    get qux() {
      return this.count
    }
    @consume set qux(value: number) {
      this.count += 1
    }
    connectedCallback() {
      this.textContent = `${this.foo} ${this.bar}`
    }
  }
  window.customElements.define('providable-consumer-test', ProvidableConsumerTest)

  describe('consumer without provider', () => {
    let instance: ProvidableConsumerTest
    let events = fake()
    beforeEach(async () => {
      events = fake()
      document.body.addEventListener('context-request', events)
      instance = await fixture(html`<providable-consumer-test />`)
    })
    afterEach(() => {
      document.body.removeEventListener('context-request', events)
    })

    it('uses the given values', () => {
      expect(instance).to.have.property('foo', 'goodbye')
      expect(instance).to.have.property('bar', 'universe')
      expect(instance).to.have.property('baz', 1)
      expect(instance).to.have.property(sym).eql({})
      expect(instance).to.have.property('textContent', 'goodbye universe')
    })

    it('overrides the property definitions to not be setters', () => {
      expect(() => (instance.foo = 'hello')).to.throw()
      expect(() => (instance.bar = 'world')).to.throw()
      // @ts-expect-error this was only a getter to begin with
      expect(() => (instance.baz = 3)).to.throw()
    })

    it('emits the `context-request` event when connected, for each field', async () => {
      expect(events).to.have.callCount(5)
      const fooEvent = events.getCall(0).args[0]
      expect(fooEvent).to.be.instanceof(ContextEvent)
      expect(fooEvent).to.have.nested.property('context.name', 'foo')
      expect(fooEvent).to.have.nested.property('context.initialValue', 'goodbye')
      expect(fooEvent).to.have.property('multiple', true)
      expect(fooEvent).to.have.property('bubbles', true)

      const barEvent = events.getCall(1).args[0]
      expect(barEvent).to.be.instanceof(ContextEvent)
      expect(barEvent).to.have.nested.property('context.name', 'bar')
      expect(barEvent).to.have.nested.property('context.initialValue', 'universe')
      expect(barEvent).to.have.property('multiple', true)
      expect(barEvent).to.have.property('bubbles', true)

      const bazEvent = events.getCall(2).args[0]
      expect(bazEvent).to.be.instanceof(ContextEvent)
      expect(bazEvent).to.have.nested.property('context.name', 'baz')
      expect(bazEvent).to.have.nested.property('context.initialValue', 1)
      expect(bazEvent).to.have.property('multiple', true)
      expect(bazEvent).to.have.property('bubbles', true)

      const bingEvent = events.getCall(3).args[0]
      expect(bingEvent).to.be.instanceof(ContextEvent)
      expect(bingEvent).to.have.nested.property('context.name', sym)
      expect(bingEvent).to.have.nested.property('context.initialValue').eql({})
      expect(bingEvent).to.have.property('multiple', true)
      expect(bingEvent).to.have.property('bubbles', true)

      const quxEvent = events.getCall(4).args[0]
      expect(quxEvent).to.be.instanceof(ContextEvent)
      expect(quxEvent).to.have.nested.property('context.name', 'qux')
      expect(quxEvent).to.have.nested.property('context.initialValue').eql(0)
      expect(quxEvent).to.have.property('multiple', true)
      expect(quxEvent).to.have.property('bubbles', true)
    })

    it('changes value based on callback new value', async () => {
      expect(events).to.have.callCount(5)
      const fooCallback = events.getCall(0).args[0].callback
      fooCallback('hello')
      expect(instance).to.have.property('foo', 'hello')
      fooCallback('goodbye')
      expect(instance).to.have.property('foo', 'goodbye')
    })

    it('disposes of past callbacks when given new ones', async () => {
      const dispose1 = fake()
      const dispose2 = fake()
      expect(events).to.have.callCount(5)
      const fooCallback = events.getCall(0).args[0].callback
      fooCallback('hello', dispose1)
      expect(dispose1).to.have.callCount(0)
      expect(dispose2).to.have.callCount(0)
      fooCallback('goodbye', dispose1)
      expect(dispose1).to.have.callCount(0)
      expect(dispose2).to.have.callCount(0)
      fooCallback('greetings', dispose2)
      expect(dispose1).to.have.callCount(1)
      expect(dispose2).to.have.callCount(0)
      fooCallback('hola', dispose1)
      expect(dispose1).to.have.callCount(1)
      expect(dispose2).to.have.callCount(1)
    })
  })

  describe('provider', () => {
    let provider: ProvidableProviderTest
    beforeEach(async () => {
      provider = await fixture(
        html`<providable-provider-test
          ><div>
            <span><strong></strong></span></div
        ></providable-provider-test>`
      )
    })

    it('listens for `context-request` events, calling back with values', () => {
      const fooCallback = fake()
      provider.dispatchEvent(new ContextEvent({name: 'foo', initialValue: 'a'}, fooCallback, true))
      expect(fooCallback).to.have.callCount(1).and.be.calledWith('hello')
      const barCallback = fake()
      provider.querySelector('strong')!.dispatchEvent(new ContextEvent({name: 'bar', initialValue: 'a'}, barCallback))
      expect(barCallback).to.have.callCount(1).and.be.calledWith('world')
    })

    it('re-calls callback each time value changes', () => {
      const fooCallback = fake()
      provider.dispatchEvent(new ContextEvent({name: 'foo', initialValue: 'a'}, fooCallback, true))
      expect(fooCallback).to.have.callCount(1).and.be.calledWith('hello')
      provider.foo = 'goodbye'
      expect(fooCallback).to.have.callCount(2).and.be.calledWith('goodbye')
      provider.foo = 'greetings'
      expect(fooCallback).to.have.callCount(3).and.be.calledWith('greetings')
    })

    it('does not re-call callback if `multiple` is `false`', () => {
      const fooCallback = fake()
      provider.dispatchEvent(new ContextEvent({name: 'foo', initialValue: 'a'}, fooCallback, false))
      expect(fooCallback).to.have.callCount(1).and.be.calledWith('hello')
      provider.foo = 'goodbye'
      expect(fooCallback).to.have.callCount(1)
    })

    it('does not re-call callback once `dispose` has been called', () => {
      const fooCallback = fake()
      provider.dispatchEvent(new ContextEvent({name: 'foo', initialValue: 'a'}, fooCallback, true))
      expect(fooCallback).to.have.callCount(1).and.be.calledWith('hello')
      const dispose = fooCallback.getCall(0).args[1]
      dispose()
      provider.foo = 'goodbye'
      expect(fooCallback).to.have.callCount(1)
    })
  })

  describe('consumer with provider parent', () => {
    let provider: ProvidableProviderTest
    let consumer: ProvidableConsumerTest
    beforeEach(async () => {
      provider = await fixture(html`<providable-provider-test>
        <main>
          <article>
            <section>
              <div>
                <providable-consumer-test></providable-consumer-test>
              </div>
            </section>
          </article>
        </main>
      </providable-provider-test>`)
      consumer = provider.querySelector<ProvidableConsumerTest>('providable-consumer-test')!
    })

    it('uses values provided by provider', () => {
      expect(consumer).to.have.property('foo', 'hello')
      expect(consumer).to.have.property('bar', 'world')
      expect(consumer).to.have.property('baz', 3)
      expect(consumer).to.have.property(sym).eql({provided: true})
      expect(consumer).to.have.property('qux').eql(8)
    })

    it('updates values provided if they change', () => {
      expect(provider).to.have.property('foo', 'hello')
      expect(consumer).to.have.property('foo', 'hello')
      provider.foo = 'greetings'
      expect(consumer).to.have.property('foo', 'greetings')
    })

    it('calls consumer set callbacks when the value is updated', () => {
      expect(consumer).to.have.property('qux', 8)
      expect(consumer).to.have.property('count', 1)
      provider.qux = 17
      expect(consumer).to.have.property('qux', 17)
      expect(consumer).to.have.property('count', 2)
      provider.qux = 18
      expect(consumer).to.have.property('qux', 18)
      expect(consumer).to.have.property('count', 3)
    })
  })

  describe('error scenarios', () => {
    it('cannot decorate methods as providers', () => {
      expect(() => {
        class Foo {
          @provide foo() {}
        }
        new Foo()
      }).to.throw(/provide cannot decorate method/)
    })

    it('cannot decorate setters as providers', () => {
      expect(() => {
        class Foo {
          @provide set foo(v: string) {}
        }
        new Foo()
      }).to.throw(/provide cannot decorate setter/)
    })

    it('cannot decorate methods as consumers', () => {
      expect(() => {
        class Foo {
          @consume foo() {}
        }
        new Foo()
      }).to.throw(/consume cannot decorate method/)
    })
  })
})
