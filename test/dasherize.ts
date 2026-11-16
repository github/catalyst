import {expect} from '@open-wc/testing'
import {dasherize} from '../src/dasherize.js'

describe('dasherize', () => {
  const tests: Array<[PropertyKey, string]> = [
    ['json', 'json'],
    ['fooBar', 'foo-bar'],
    ['FooBar', 'foo-bar'],
    ['autofocusWhenReady', 'autofocus-when-ready'],
    ['URLBar', 'url-bar'],
    ['ClipX', 'clip-x'],
    ['UserIDListElement', 'user-id-list-element'],
    ['CopyURLElement', 'copy-url-element'],
    ['mySVGIcon', 'my-svg-icon'],
    ['srcURL', 'src-url'],
    ['data-URL', 'data-url'],
    ['data-srcURL', 'data-src-url'],
    [Symbol('helloWorld'), 'hello-world']
  ]

  tests.map(([input, output]) =>
    it(`transforms ${String(input)} to ${output}`, () => expect(dasherize(input)).to.equal(output))
  )
})
