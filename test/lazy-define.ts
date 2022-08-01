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
  describe('ready strategy', () => {
    it('calls define for a lazy component', async () => {
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

    it("doesn't call the same callback twice", async () => {
      const onDefine = spy()
      lazyDefine('twice-defined-element', onDefine)
      lazyDefine('once-defined-element', onDefine)
      lazyDefine('twice-defined-element', onDefine)
      await fixture(html`
        <once-defined-element></once-defined-element>
        <once-defined-element></once-defined-element>
        <once-defined-element></once-defined-element>
        <twice-defined-element></twice-defined-element>
        <twice-defined-element></twice-defined-element>
        <twice-defined-element></twice-defined-element>
        <twice-defined-element></twice-defined-element>
      `)

      await new Promise<unknown>(resolve => requestAnimationFrame(resolve))

      expect(onDefine).to.be.callCount(2)
    })
  })

  describe('firstInteraction strategy', () => {
    it('calls define for a lazy component', async () => {
      const onDefine = spy()
      lazyDefine('scan-document-test', onDefine)
      await fixture(html`<scan-document-test data-load-on="firstInteraction"></scan-document-test>`)

      await new Promise<unknown>(resolve => requestAnimationFrame(resolve))
      expect(onDefine).to.be.callCount(0)

      document.dispatchEvent(new Event('mousedown'))

      await new Promise<unknown>(resolve => requestAnimationFrame(resolve))
      expect(onDefine).to.be.callCount(1)
    })
  })
  describe('visible strategy', () => {
    it('calls define for a lazy component', async () => {
      const onDefine = spy()
      lazyDefine('scan-document-test', onDefine)
      await fixture(
        html`<div style="height: calc(100vh + 256px)"></div>
          <scan-document-test data-load-on="visible"></scan-document-test>`
      )
      await new Promise<unknown>(resolve => requestAnimationFrame(resolve))
      expect(onDefine).to.be.callCount(0)

      document.documentElement.scrollTo({top: 10})

      await new Promise<unknown>(resolve => requestAnimationFrame(resolve))
      expect(onDefine).to.be.callCount(1)
    })
  })
})
