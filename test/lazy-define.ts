import {expect, fixture, html} from '@open-wc/testing'
import {spy} from 'sinon'
import {addStrategy, lazyDefine} from '../src/lazy-define.js'

describe('addStrategy', () => {
  let strategy: ReturnType<typeof spy>
  let promise: Promise<void>
  let resolve: () => void

  beforeEach(() => {
    strategy = spy(() => promise = new Promise((res) => resolve = res))
  })

  it('adds a new strategy', async () => {
    const onDefine = spy()
    lazyDefine('foo-bar', onDefine)
    addStrategy('test', strategy)
    await fixture(html`<foo-bar data-load-on="test"></foo-bar>`)

    expect(strategy).to.be.calledOnceWith('foo-bar')
    expect(onDefine).to.have.callCount(0)
    resolve()
    await promise
    expect(onDefine).to.be.callCount(1)
  })

  it("doesn't overwrite a existing strategy", () => {
    expect(() => addStrategy('ready', spy())).to.throw(/already exists/)
  })
})

describe('lazyDefine', () => {
  it('', () => {})
})
