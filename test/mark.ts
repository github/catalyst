import {expect} from '@open-wc/testing'
import {fake} from 'sinon'
import {createMark, observe} from '../src/mark.js'

describe('createMark', () => {
  it('returns a tuple of functions: mark, getMarks, initializeMarks', () => {
    const mark = createMark(
      () => {},
      () => ({})
    )
    expect(mark).to.be.an('array').with.lengthOf(3)
    expect(mark).to.have.property('0').a('function')
    expect(mark).to.have.property('1').a('function')
    expect(mark).to.have.property('2').a('function')
  })

  it('attaches a `static` unique symbol to the first function', () => {
    const mark = createMark(
      () => {},
      () => ({})
    )
    expect(mark).to.have.nested.property('0.static').a('symbol')
    const otherMark = createMark(
      () => {},
      () => ({})
    )
    expect(otherMark).to.have.nested.property('0.static').a('symbol').not.equal(mark[0].static)
  })

  it('can be added to class fields without errors', () => {
    const [mark] = createMark(
      () => {},
      () => ({})
    )
    class FooBar {
      @mark foo: unknown
      @mark bar = 1
      @mark baz = 'hi'
    }
    new FooBar()
  })

  it('can be added to getters or setters without errors', () => {
    const [mark] = createMark(
      () => {},
      () => ({})
    )
    class FooBar {
      @mark get foo() {
        return 1
      }
      set foo(v: number) {}

      @mark get bar() {
        return 1
      }
      @mark set baz(v: number) {}
    }
    new FooBar()
  })

  it('can be added to methods without errors', () => {
    const [mark] = createMark(
      () => {},
      () => ({})
    )
    class Foo {
      @mark foo() {}
    }
    new Foo()
  })

  it('retrieves all marked fields with the get mark function', () => {
    const [mark, getMark] = createMark(
      () => {},
      () => ({})
    )
    class FooBar {
      @mark foo: unknown
      @mark bar = 1
      @mark baz = 'hi'
      @mark get bing() {
        return 1
      }
      @mark get qux() {
        return 1
      }
      @mark set quuz(v: number) {}
      @mark set corge(v: number) {}
      @mark grault() {}
    }
    expect(getMark(new FooBar())).to.eql(new Set(['foo', 'bar', 'baz', 'bing', 'qux', 'quuz', 'corge', 'grault']))
  })

  it('retrieves marked symbol methods correctly', () => {
    const [mark, getMark] = createMark(
      () => {},
      () => ({})
    )
    const sym = Symbol('foo')
    class FooBar {
      @mark [sym]() {}
    }
    expect(getMark(new FooBar()).has(sym)).to.equal(true)
  })

  it('retrieves fields declared using the `mark.static` symbol as a static class field', () => {
    const [mark, getMark] = createMark(
      () => {},
      () => ({})
    )
    class FooBar {
      static [mark.static] = ['bar', 'bing', 'quuz', 'grault']
      @mark foo: unknown
      bar = 1
      @mark baz = 'hi'
      get bing() {
        return 1
      }
      @mark get qux() {
        return 1
      }
      set quuz(v: number) {}
      @mark set corge(v: number) {}
      grault() {}
    }
    const instance = new FooBar()
    expect(getMark(instance)).to.eql(new Set(['foo', 'baz', 'qux', 'corge', 'bar', 'bing', 'quuz', 'grault']))
  })

  it('will not contain duplicates', () => {
    const [mark, getMark] = createMark(
      () => {},
      () => ({})
    )
    class FooBar {
      static [mark.static] = ['bar', 'bing', 'quuz', 'grault']
      @mark foo: unknown
      @mark bar = 1
      @mark baz = 'hi'
      @mark get bing() {
        return 1
      }
      @mark get qux() {
        return 1
      }
      @mark set quuz(v: number) {}
      @mark set corge(v: number) {}
      @mark grault() {}
    }
    expect(getMark(new FooBar())).to.eql(new Set(['foo', 'bar', 'baz', 'bing', 'qux', 'quuz', 'corge', 'grault']))
  })

  it('calls the given validate function for each field, with name and kind', () => {
    const validate = fake()
    const [mark, getMarks] = createMark(validate, () => {})
    const sym = Symbol('garply')
    class FooBar {
      static [mark.static] = ['bar', 'bing', 'quuz', 'grault']
      @mark foo: unknown
      bar = 1
      @mark baz = 'hi'
      get bing() {
        return 1
      }
      @mark get qux() {
        return 1
      }
      set quuz(v: number) {}
      @mark set corge(v: number) {}
      grault() {}
      @mark [sym]() {}
    }
    getMarks(new FooBar())
    expect(validate).to.be.calledWithExactly({name: 'foo', kind: 'field'})
    expect(validate).to.be.calledWithExactly({name: 'bar', kind: 'field'})
    expect(validate).to.be.calledWithExactly({name: 'baz', kind: 'field'})
    expect(validate).to.be.calledWithExactly({name: 'bing', kind: 'getter'})
    expect(validate).to.be.calledWithExactly({name: 'qux', kind: 'getter'})
    expect(validate).to.be.calledWithExactly({name: 'quuz', kind: 'setter'})
    expect(validate).to.be.calledWithExactly({name: 'corge', kind: 'setter'})
    expect(validate).to.be.calledWithExactly({name: 'grault', kind: 'method'})
    expect(validate).to.be.calledWithExactly({name: sym, kind: 'method'})
  })

  it('calls the given initialize function for each static defined field once initialized, with name, kind and access', () => {
    const validate = fake()
    const initialize = fake(({access}) => access)
    const [mark, getMarks, initializeMarks] = createMark(validate, initialize)
    const sym = Symbol('garply')
    class FooBar {
      static [mark.static] = ['bar', 'bing', 'quuz', 'grault']
      @mark foo: unknown
      bar = 1
      @mark baz = 'hi'
      get bing() {
        return 1
      }
      @mark get qux() {
        return 1
      }
      set quuz(v: number) {}
      @mark set corge(v: number) {}
      grault() {}
      @mark [sym]() {}
    }
    const fooBar = new FooBar()
    getMarks(fooBar)
    expect(initialize).to.have.callCount(0)
    initializeMarks(fooBar)
    const accessFor = (field: PropertyKey) => Object.getOwnPropertyDescriptor(FooBar.prototype, field)
    expect(initialize).to.be.calledWithExactly(fooBar, {
      name: 'foo',
      kind: 'field',
      access: {value: void 0, configurable: true, writable: true, enumerable: true}
    })
    expect(initialize).to.be.calledWithExactly(fooBar, {
      name: 'bar',
      kind: 'field',
      access: {value: 1, configurable: true, writable: true, enumerable: true}
    })
    expect(initialize).to.be.calledWithExactly(fooBar, {
      name: 'baz',
      kind: 'field',
      access: {value: 'hi', configurable: true, writable: true, enumerable: true}
    })
    expect(initialize).to.be.calledWithExactly(fooBar, {name: 'bing', kind: 'getter', access: accessFor('bing')})
    expect(initialize).to.be.calledWithExactly(fooBar, {name: 'qux', kind: 'getter', access: accessFor('qux')})
    expect(initialize).to.be.calledWithExactly(fooBar, {name: 'quuz', kind: 'setter', access: accessFor('quuz')})
    expect(initialize).to.be.calledWithExactly(fooBar, {name: 'corge', kind: 'setter', access: accessFor('corge')})
    expect(initialize).to.be.calledWithExactly(fooBar, {name: 'grault', kind: 'method', access: accessFor('grault')})
    expect(initialize).to.be.calledWithExactly(fooBar, {name: sym, kind: 'method', access: accessFor(sym)})
  })

  it('can apply multiple different marks to the same property', () => {
    const [mark1, getMarks1, initializeMarks1] = createMark(
      fake(),
      fake(() => ({get: fake(), set: fake()}))
    )
    const [mark2, getMarks2, initializeMarks2] = createMark(
      fake(),
      fake(() => ({get: fake(), set: fake()}))
    )
    class FooBar {
      @mark1 @mark2 foo: unknown
      @mark2 @mark1 bar = 'hi'
      constructor() {
        initializeMarks1(this)
        initializeMarks2(this)
      }
    }
    const fooBar = new FooBar()
    expect(Array.from(getMarks1(fooBar))).to.eql(['foo', 'bar'])
    expect(Array.from(getMarks2(fooBar))).to.eql(['foo', 'bar'])
  })

  it('can observe changes to marks', () => {
    const [mark1, getMarks1, initializeMarks1] = createMark(
      fake(),
      fake(() => ({get: fake(), set: fake()}))
    )
    const [mark2, getMarks2, initializeMarks2] = createMark(
      fake(),
      fake(() => ({get: fake(), set: fake()}))
    )
    const observer = fake()
    class FooBar {
      @mark1 foo: unknown
      @mark2 bar = 'hi'
      get baz() {
        return 1
      }
      @mark1 set baz(_: unknown) {}

      constructor() {
        observe(this, observer)
        initializeMarks1(this)
        initializeMarks2(this)
      }
    }
    const fooBar = new FooBar()
    expect(observer).to.have.callCount(0)
    fooBar.foo = 1
    expect(observer).to.have.callCount(1).and.be.calledWithExactly('foo', undefined, 1)
    fooBar.bar = 'bye'
    expect(observer).to.have.callCount(2).and.be.calledWithExactly('bar', 'hi', 'bye')
    fooBar.baz = 3
    expect(observer).to.have.callCount(3).and.be.calledWithExactly('baz', 1, 3)
  })
})
