import {expect, fixture, html} from '@open-wc/testing'
import {spy} from 'sinon'
import {lazyDefine, observe} from '../src/lazy-define.js'

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

    it('takes an object as well', async () => {
      const onDefine1 = spy()
      const onDefine2 = spy()
      const onDefine3 = spy()
      lazyDefine({
        'first-object-element': onDefine1,
        'second-object-element': onDefine2,
        'third-object-element': onDefine3
      })
      await fixture(html`
        <first-object-element></first-object-element>
        <second-object-element></second-object-element>
        <third-object-element></third-object-element>
      `)

      await animationFrame()

      expect(onDefine1).to.have.callCount(1)
      expect(onDefine2).to.have.callCount(1)
      expect(onDefine3).to.have.callCount(1)
    })

    it('lazy loads elements in shadow roots', async () => {
      const onDefine = spy()
      lazyDefine('nested-shadow-element', onDefine)

      const el = await fixture(html` <div></div> `)
      const shadowRoot = el.attachShadow({mode: 'open'})
      observe(shadowRoot)
      // eslint-disable-next-line github/unescaped-html-literal
      shadowRoot.innerHTML = '<div><nested-shadow-element></nested-shadow-element></div>'

      await animationFrame()

      expect(onDefine).to.be.callCount(1)
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
