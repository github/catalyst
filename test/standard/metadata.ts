// Imports Catalyst first and avoids @open-wc/testing, because Lit defines `Symbol.metadata` too.
import {controller} from '../../src/controller.js'
import {attr} from '../../src/attr.js'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

describe('Symbol.metadata (standard decorators)', () => {
  it('is defined when Catalyst loads, so TypeScript output includes decorator metadata', () => {
    const metadata = (Symbol as {metadata?: symbol}).metadata
    assert(metadata === Symbol.for('Symbol.metadata'), `expected Symbol.metadata, got ${String(metadata)}`)
  })

  it('registers attrs from TypeScript output', () => {
    @controller
    class StandardMetadataElement extends HTMLElement {
      @attr foo = 'bar'
    }
    const instance = document.createElement('standard-metadata')
    document.body.append(instance)
    assert(instance instanceof StandardMetadataElement, 'expected the element to be defined')
    assert(
      instance.getAttribute('data-foo') === 'bar',
      `expected data-foo="bar", got ${instance.getAttribute('data-foo')}`
    )
    instance.remove()
  })
})
