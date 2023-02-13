import {expect, fixture, html} from '@open-wc/testing'
import {fake} from 'sinon'
import {provide, provideAsync, consume, providable, ContextEvent} from '../src/providable.js'
import {target, targetable} from '../src/targetable.js'
import {attr, attrable} from '../src/attrable.js'

describe('Providable', () => {
  const sym = Symbol('bing')
  @attrable
  @targetable
  @providable
  class ProvidableProviderTest extends HTMLElement {
    @provide foo = 'hello'
    @provide bar = 'world'
    @provide get baz() {
      return 3
    }
    @provide [sym] = {provided: true}
    @provide qux = 8
    @provide @attr testAttribute = ''
    @provide @target target!: HTMLElement
  }
  window.customElements.define('providable-provider-test', ProvidableProviderTest)

  @providable
  class AsyncProvidableProviderTest extends HTMLElement {
    @provideAsync foo = Promise.resolve('hello')
    @provideAsync bar = Promise.resolve('world')
    @provideAsync get baz() {
      return Promise.resolve(3)
    }
    @provideAsync [sym] = Promise.resolve({provided: true})
    @provideAsync qux = Promise.resolve(8)
  }
  window.customElements.define('async-providable-provider-test', AsyncProvidableProviderTest)

  @providable
  class ProvidableSomeProviderTest extends HTMLElement {
    @provide foo = 'greetings'
    bar = 'universe'
    baz = 18
    @provide qux = 42
  }
  window.customElements.define('providable-some-provider-test', ProvidableSomeProviderTest)

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
    @consume target!: HTMLElement
    @consume testAttribute = ''
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
      expect(events).to.have.callCount(7)
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
      expect(quxEvent).to.have.nested.property('context.initialValue', 0)
      expect(quxEvent).to.have.property('multiple', true)
      expect(quxEvent).to.have.property('bubbles', true)

      const targetEvent = events.getCall(5).args[0]
      expect(targetEvent).to.be.instanceof(ContextEvent)
      expect(targetEvent).to.have.nested.property('context.name', 'target')
      expect(targetEvent).to.have.nested.property('context.initialValue', undefined)
      expect(targetEvent).to.have.property('multiple', true)
      expect(targetEvent).to.have.property('bubbles', true)

      const attrEvent = events.getCall(6).args[0]
      expect(attrEvent).to.be.instanceof(ContextEvent)
      expect(attrEvent).to.have.nested.property('context.name', 'testAttribute')
      expect(attrEvent).to.have.nested.property('context.initialValue', '')
      expect(attrEvent).to.have.property('multiple', true)
      expect(attrEvent).to.have.property('bubbles', true)
    })

    it('changes value based on callback new value', async () => {
      expect(events).to.have.callCount(7)
      const fooCallback = events.getCall(0).args[0].callback
      fooCallback('hello')
      expect(instance).to.have.property('foo', 'hello')
      fooCallback('goodbye')
      expect(instance).to.have.property('foo', 'goodbye')
    })

    it('disposes of past callbacks when given new ones', async () => {
      const dispose1 = fake()
      const dispose2 = fake()
      expect(events).to.have.callCount(7)
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
        html`<providable-provider-test>
          <div>
            <span><strong></strong></span>
          </div>
        </providable-provider-test>`
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
      provider = await fixture(html`<providable-provider-test test-attribute="x">
        <main>
          <article>
            <section>
              <div>
                <providable-consumer-test></providable-consumer-test>
              </div>
            </section>
          </article>
        </main>
        <small data-target="providable-provider-test.target"></small>
      </providable-provider-test>`)
      consumer = provider.querySelector<ProvidableConsumerTest>('providable-consumer-test')!
    })

    it('uses values provided by provider', () => {
      expect(consumer).to.have.property('foo', 'hello')
      expect(consumer).to.have.property('bar', 'world')
      expect(consumer).to.have.property('baz', 3)
      expect(consumer).to.have.property(sym).eql({provided: true})
      expect(consumer).to.have.property('qux', 8)
      expect(consumer).to.have.property('target', provider.querySelector('small')!)
      expect(consumer).to.have.property('testAttribute', 'x')
    })

    it('updates values provided if they change', () => {
      expect(provider).to.have.property('foo', 'hello')
      expect(consumer).to.have.property('foo', 'hello')
      provider.foo = 'greetings'
      expect(consumer).to.have.property('foo', 'greetings')
    })

    it('updates @provide @attr values if they change', async () => {
      provider.setAttribute('test-attribute', 'y')
      await Promise.resolve()
      expect(consumer).to.have.property('testAttribute', 'y')
    })

    it('updates @provide @target values if they change', async () => {
      const big = document.createElement('big')
      big.setAttribute('data-target', 'providable-provider-test.target')
      provider.prepend(big)
      await Promise.resolve()
      expect(consumer).to.have.property('target', big)
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

  describe('consumer with nested provider parents', () => {
    let provider: ProvidableProviderTest
    let someProvider: ProvidableSomeProviderTest
    let consumer: ProvidableConsumerTest
    beforeEach(async () => {
      provider = await fixture(html`<providable-provider-test>
        <main>
          <article>
            <providable-some-provider-test>
              <section>
                <div>
                  <providable-consumer-test></providable-consumer-test>
                </div>
              </section>
            </providable-some-provider-test>
          </article>
        </main>
      </providable-provider-test>`)
      someProvider = provider.querySelector<ProvidableSomeProviderTest>('providable-some-provider-test')!
      consumer = provider.querySelector<ProvidableConsumerTest>('providable-consumer-test')!
    })

    it('only recieves provider responses from first matching provider', () => {
      expect(consumer).to.have.property('foo', 'greetings')
      expect(consumer).to.have.property('bar', 'world')
      expect(consumer).to.have.property('baz', 3)
      expect(consumer).to.have.property(sym).eql({provided: true})
      expect(consumer).to.have.property('qux').eql(42)
      expect(consumer).to.have.property('count').eql(1)
    })

    it('only updates on appropriate provider changing values', () => {
      expect(consumer).to.have.property('qux').eql(42)
      expect(consumer).to.have.property('count').eql(1)
      provider.qux = 12
      expect(consumer).to.have.property('qux').eql(42)
      expect(consumer).to.have.property('count').eql(1)
      someProvider.qux = 88
      expect(consumer).to.have.property('qux').eql(88)
      expect(consumer).to.have.property('count').eql(2)
    })
  })

  describe('async provider', () => {
    let provider: AsyncProvidableProviderTest
    let consumer: ProvidableConsumerTest
    beforeEach(async () => {
      provider = await fixture(html`<async-providable-provider-test>
        <providable-consumer-test></providable-consumer-test>
      </async-providable-provider-test>`)
      consumer = provider.querySelector<ProvidableConsumerTest>('providable-consumer-test')!
    })

    it('passes resovled values to consumer', async () => {
      expect(consumer).to.have.property('foo', 'hello')
      expect(consumer).to.have.property('bar', 'world')
      expect(consumer).to.have.property('baz', 3)
      expect(consumer).to.have.property(sym).eql({provided: true})
      expect(consumer).to.have.property('qux').eql(8)
      expect(consumer).to.have.property('count').eql(1)
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
