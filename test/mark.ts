import {expect} from '@open-wc/testing'
import {fake} from 'sinon'
import {createMark} from '../src/mark.js'

describe('createMark', () => {
  it('returns a tuple of functions: a mark and getMarks', () => {
    const mark = createMark(() => {})
    expect(mark).to.be.an('array').with.lengthOf(2)
    expect(mark).to.have.property(0).a('function')
    expect(mark).to.have.property(1).a('function')
  })

  it('attaches a `static` unique symbol to the first function', () => {
    const mark = createMark(() => {})
    expect(mark).to.have.nested.property('0.static').a('symbol')
    const otherMark = createMark(() => {})
    expect(otherMark).to.have.nested.property('0.static').a('symbol').not.equal(mark[0].static)
  })

  it('can be added to class fields without errors', () => {
    const [mark] = createMark(() => {})
    class FooBar {
      @mark foo
      @mark bar = 1
      @mark baz = 'hi'
    }
    new FooBar()
  })

  it('can be added to getters or setters without errors', () => {
    const [mark] = createMark(() => {})
    class FooBar {
      @mark get foo() {}
      set foo(v) {}

      @mark get bar() {}
      @mark set baz(v) {}
    }
    new FooBar()
  })

  it('can be added to methods without errors', () => {
    const [mark] = createMark(() => {})
    class Foo {
      @mark foo() {}
    }
    new Foo()
  })

  it('retrieves all marked fields with the get mark function', () => {
    const [mark, getMark] = createMark(() => {})
    class FooBar {
      @mark foo
      @mark bar = 1
      @mark baz = 'hi'
      @mark get bing() {}
      @mark get qux() {}
      @mark set quuz(v) {}
      @mark set corge(v) {}
      @mark grault() {}
    }
    expect(getMark(new FooBar())).to.eql(new Set(['foo', 'bar', 'baz', 'bing', 'qux', 'quuz', 'corge', 'grault']))
  })

  it('retrieves marked symbol methods correctly', () => {
    const [mark, getMark] = createMark(() => {})
    const sym = Symbol('foo')
    class FooBar {
      @mark [sym]() {}
    }
    expect(getMark(new FooBar()).has(sym)).to.equal(true)
  })

  it('retrieves fields declared using the `mark.static` symbol as a static class field', () => {
    const [mark, getMark] = createMark(() => {})
    class FooBar {
      static [mark.static] = ['bar', 'bing', 'quuz', 'grault']
      @mark foo
      bar = 1
      @mark baz = 'hi'
      get bing() {}
      @mark get qux() {}
      set quuz(v) {}
      @mark set corge(v) {}
      grault() {}
    }
    const instance = new FooBar()
    expect(getMark(instance)).to.eql(new Set(['foo', 'baz', 'qux', 'corge', 'bar', 'bing', 'quuz', 'grault']))
  })

  it('will not contain duplicates', () => {
    const [mark, getMark] = createMark(() => {})
    class FooBar {
      static [mark.static] = ['bar', 'bing', 'quuz', 'grault']
      @mark foo
      @mark bar = 1
      @mark baz = 'hi'
      @mark get bing() {}
      @mark get qux() {}
      @mark set quuz(v) {}
      @mark set corge(v) {}
      @mark grault() {}
    }
    expect(getMark(new FooBar())).to.eql(new Set(['foo', 'bar', 'baz', 'bing', 'qux', 'quuz', 'corge', 'grault']))
  })

  it('calls the given function for each field, with name and type', () => {
    const validate = fake()
    const [mark] = createMark(validate)
    const sym = Symbol('garply')
    class FooBar {
      @mark foo
      @mark bar = 1
      @mark baz = 'hi'
      @mark get bing() {}
      @mark get qux() {}
      @mark set quuz(v) {}
      @mark set corge(v) {}
      @mark grault() {}
      @mark [sym]() {}
    }
    expect(validate).to.be.calledWith('foo', 'field')
    expect(validate).to.be.calledWith('bar', 'field')
    expect(validate).to.be.calledWith('baz', 'field')
    expect(validate).to.be.calledWith('bing', 'getter')
    expect(validate).to.be.calledWith('qux', 'getter')
    expect(validate).to.be.calledWith('quuz', 'setter')
    expect(validate).to.be.calledWith('corge', 'setter')
    expect(validate).to.be.calledWith('grault', 'method')
    expect(validate).to.be.calledWith(sym, 'method')
    return new FooBar()
  })

  it('calls the given function for each static defined field once initialized, with name and type', () => {
    const validate = fake()
    const [mark, getMark] = createMark(validate)
    class FooBar {
      static [mark.static] = ['foo', 'bar', 'baz', 'bing', 'qux', 'quuz', 'corge', 'grault']
      foo
      bar = 1
      baz = 'hi'
      get bing() {}
      get qux() {}
      set quuz(v) {}
      set corge(v) {}
      grault() {}
    }
    getMark(new FooBar())
    expect(validate).to.be.calledWith('foo', 'field')
    expect(validate).to.be.calledWith('bar', 'field')
    expect(validate).to.be.calledWith('baz', 'field')
    expect(validate).to.be.calledWith('bing', 'getter')
    expect(validate).to.be.calledWith('qux', 'getter')
    expect(validate).to.be.calledWith('quuz', 'setter')
    expect(validate).to.be.calledWith('corge', 'setter')
    expect(validate).to.be.calledWith('grault', 'method')
  })
})
