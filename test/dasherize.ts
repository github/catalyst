import {expect} from '@open-wc/testing'
import {dasherize, mustDasherize} from '../src/dasherize.js'

describe('dasherize', () => {
  const tests: Array<[PropertyKey, string]> = [
    ['json', 'json'],
    ['fooBar', 'foo-bar'],
    ['FooBar', 'foo-bar'],
    ['autofocusWhenReady', 'autofocus-when-ready'],
    ['URLBar', 'url-bar'],
    ['ClipX', 'clip-x'],
    [Symbol('helloWorld'), 'hello-world']
  ]

  tests.map(([input, output]) =>
    it(`transforms ${String(input)} to ${output}`, () => expect(dasherize(input)).to.equal(output))
  )
})

describe('mustDasherize', () => {
  it('returns the dasherized name when it contains a dash', () => {
    expect(mustDasherize('fooBar')).to.equal('foo-bar')
  })

  it('passes the custom type through to the returned name', () => {
    expect(mustDasherize('fooBar', 'controller')).to.equal('foo-bar')
  })

  it('throws a SyntaxError when the name has no dash', () => {
    let error: unknown
    try {
      mustDasherize('json')
    } catch (caught) {
      error = caught
    }
    expect(error).to.be.instanceOf(DOMException)
    expect((error as DOMException).name).to.equal('SyntaxError')
    expect((error as DOMException).message).to.equal('property: json is not a valid property name')
  })

  it('names the custom type in the thrown error', () => {
    let error: unknown
    try {
      mustDasherize('json', 'controller')
    } catch (caught) {
      error = caught
    }
    expect(error).to.be.instanceOf(DOMException)
    expect((error as DOMException).name).to.equal('SyntaxError')
    expect((error as DOMException).message).to.equal('controller: json is not a valid controller name')
  })
})
