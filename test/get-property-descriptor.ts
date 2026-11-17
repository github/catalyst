import {expect} from '@open-wc/testing'
import {getPropertyDescriptor} from '../src/get-property-descriptor.js'

describe('getPropertyDescriptor', () => {
  it('returns the descriptor of an own property', () => {
    const descriptor = getPropertyDescriptor({foo: 'bar'}, 'foo')
    expect(descriptor).to.include({value: 'bar', writable: true, enumerable: true, configurable: true})
  })

  it('finds a descriptor up the prototype chain', () => {
    class Base {
      greet() {
        return 'hello'
      }
    }
    class Child extends Base {}
    const descriptor = getPropertyDescriptor(new Child(), 'greet')
    expect(descriptor).to.have.property('value').a('function')
    expect(descriptor?.value()).to.equal('hello')
  })

  it('returns the accessor descriptor for getters', () => {
    class WithGetter {
      get size() {
        return 42
      }
    }
    const descriptor = getPropertyDescriptor(new WithGetter(), 'size')
    expect(descriptor).to.have.property('get').a('function')
    expect(descriptor?.get?.()).to.equal(42)
  })

  it('works with symbol keys', () => {
    const sym = Symbol('hello')
    const descriptor = getPropertyDescriptor({[sym]: 1}, sym)
    expect(descriptor).to.include({value: 1})
  })

  it('returns undefined for a missing key', () => {
    expect(getPropertyDescriptor({foo: 'bar'}, 'baz')).to.equal(undefined)
    expect(getPropertyDescriptor({}, 'toString')).to.not.equal(undefined)
  })
})
