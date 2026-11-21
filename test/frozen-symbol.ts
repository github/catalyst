import {expect} from '@open-wc/testing'

describe('frozen Symbol', () => {
  it('can still import Catalyst', async () => {
    const symbolWithMetadata = Symbol as {metadata?: symbol}
    // Lit, loaded by @open-wc/testing, defines `Symbol.metadata`. Remove it so Catalyst tries to define it.
    delete symbolWithMetadata.metadata
    Object.freeze(Symbol)
    const catalyst = await import('../src/index.js')
    expect(catalyst.controller).to.be.a('function')
    expect(symbolWithMetadata.metadata).to.equal(undefined)
  })
})
