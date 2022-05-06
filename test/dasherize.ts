import {expect} from '@open-wc/testing'
import {dasherize} from '../src/dasherize.js'

describe('dasherize', () => {
  const tests = [
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
