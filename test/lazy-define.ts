import {expect, fixture, html} from '@open-wc/testing'
import {spy} from 'sinon'
import {lazyDefine} from '../src/lazy-define.js'

const animationFrame = () => new Promise<unknown>(resolve => requestAnimationFrame(resolve))

describe('lazyDefine', () => {
  describe('ready strategy', () => {
    it('calls define for a lazy component', async () => {
      const onDefine = spy()
      lazyDefine('scan-document-test', onDefine)
      await fixture(html`<scan-document-test></scan-document-test>`)

      await animationFrame()

      expect(onDefine).to.be.callCount(1)
    })

    it('initializes dynamic elements that are defined after the document is ready', async () => {
      const onDefine = spy()
      await fixture(html`<later-defined-element-test></later-defined-element-test>`)
      lazyDefine('later-defined-element-test', onDefine)

      await animationFrame()

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

      await animationFrame()

      expect(onDefine).to.be.callCount(2)
    })
  })

  describe('firstInteraction strategy', () => {
    it('calls define for a lazy component', async () => {
      const onDefine = spy()
      lazyDefine('scan-document-test', onDefine)
      await fixture(html`<scan-document-test data-load-on="firstInteraction"></scan-document-test>`)

      await animationFrame()
      expect(onDefine).to.be.callCount(0)

      document.dispatchEvent(new Event('mousedown'))

      await animationFrame()
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
      await animationFrame()
      expect(onDefine).to.be.callCount(0)

      document.documentElement.scrollTo({top: 10})

      await animationFrame()
      expect(onDefine).to.be.callCount(1)
    })
  })
})
