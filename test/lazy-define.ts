import {expect, fixture, html} from '@open-wc/testing'
import {spy} from 'sinon'
import {addStrategy, lazyDefine} from '../src/lazy-define.js'

describe('addStrategy', () => {
  let strategy: ReturnType<typeof spy>
  let promise: Promise<void>
  let resolve: () => void

  beforeEach(() => {
    strategy = spy(() => (promise = new Promise(res => (resolve = res))))
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
  it('scans the whole document on first call', async () => {
    const onDefine = spy()
    lazyDefine('scan-document-test', onDefine)
    await fixture(html`<scan-document-test></scan-document-test>`)

    await new Promise<unknown>(resolve => requestAnimationFrame(resolve))

    expect(onDefine).to.be.callCount(1)
  })
  it('initializes dynamic elements that are defined after the document is ready', async () => {
    const onDefine = spy()
    await fixture(html`<later-defined-element-test></later-defined-element-test>`)
    lazyDefine('later-defined-element-test', onDefine)

    await new Promise<unknown>(resolve => requestAnimationFrame(resolve))

    expect(onDefine).to.be.callCount(1)
  })
  it("doesn't call the same callback twice", () => {})
})
