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

    it('waits for element to be added to DOM before observing', async () => {
      const onDefine = spy()
      lazyDefine('late-visible-element', onDefine)
      
      await animationFrame()
      expect(onDefine).to.be.callCount(0)

      // Add the element later
      await fixture(html`<late-visible-element data-load-on="visible"></late-visible-element>`)
      
      await animationFrame()
      expect(onDefine).to.be.callCount(1)
    })
  })

  describe('race condition prevention', () => {
    it('does not fire callbacks multiple times from concurrent scans', async () => {
      const onDefine = spy()
      lazyDefine('race-test-element', onDefine)

      // Create multiple elements to trigger multiple scans
      const el1 = await fixture(html`<race-test-element></race-test-element>`)
      const el2 = await fixture(html`<race-test-element></race-test-element>`)

      await animationFrame()
      await animationFrame()

      // Should only be called once despite multiple elements triggering scans
      expect(onDefine).to.be.callCount(1)
    })
  })

  describe('late registration', () => {
    it('executes callback immediately for already-triggered tags', async () => {
      const onDefine1 = spy()
      const onDefine2 = spy()

      // Register and trigger first callback
      lazyDefine('late-reg-element', onDefine1)
      await fixture(html`<late-reg-element></late-reg-element>`)
      await animationFrame()
      expect(onDefine1).to.be.callCount(1)

      // Register second callback after element is already triggered
      lazyDefine('late-reg-element', onDefine2)
      await animationFrame()
      
      // Second callback should be executed immediately
      expect(onDefine2).to.be.callCount(1)
    })
  })

  describe('error handling', () => {
    it('handles callback errors without breaking other callbacks', async () => {
      const onDefine1 = spy(() => {
        throw new Error('Test error')
      })
      const onDefine2 = spy()

      // Suppress global error reporting for this test
      const originalReportError = globalThis.reportError
      const errors: unknown[] = []
      globalThis.reportError = (err: unknown) => errors.push(err)

      try {
        lazyDefine('error-test-element', onDefine1)
        lazyDefine('error-test-element', onDefine2)

        await fixture(html`<error-test-element></error-test-element>`)
        await animationFrame()

        // Both callbacks should be called despite first one throwing
        expect(onDefine1).to.be.callCount(1)
        expect(onDefine2).to.be.callCount(1)
        
        // Error should have been reported
        expect(errors.length).to.be.greaterThan(0)
      } finally {
        globalThis.reportError = originalReportError
      }
    })
  })

  describe('redundant observe calls', () => {
    it('does not observe the same target multiple times', async () => {
      const onDefine = spy()
      const el = await fixture(html`<div></div>`)
      const shadowRoot = el.attachShadow({mode: 'open'})

      // Observe the same shadow root multiple times
      observe(shadowRoot)
      observe(shadowRoot)
      observe(shadowRoot)

      lazyDefine('redundant-test-element', onDefine)
      // eslint-disable-next-line github/unescaped-html-literal
      shadowRoot.innerHTML = '<redundant-test-element></redundant-test-element>'

      await animationFrame()

      // Should still only be called once
      expect(onDefine).to.be.callCount(1)
    })
  })
})
