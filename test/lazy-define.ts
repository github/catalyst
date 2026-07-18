import {expect, fixture, html} from '@open-wc/testing'
import {spy, stub} from 'sinon'
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

    it('coalesces multiple added elements into a single rAF callback', async () => {
      const onDefine = spy()
      lazyDefine('coalesce-test-element', onDefine)

      const rafSpy = spy(window, 'requestAnimationFrame')
      const callsBefore = rafSpy.callCount

      await fixture(html`
        <div>
          <coalesce-test-element></coalesce-test-element>
          <coalesce-test-element></coalesce-test-element>
          <coalesce-test-element></coalesce-test-element>
          <coalesce-test-element></coalesce-test-element>
          <coalesce-test-element></coalesce-test-element>
          <coalesce-test-element></coalesce-test-element>
          <coalesce-test-element></coalesce-test-element>
          <coalesce-test-element></coalesce-test-element>
          <coalesce-test-element></coalesce-test-element>
          <coalesce-test-element></coalesce-test-element>
        </div>
      `)

      await animationFrame()

      const rafCallsFromScan = rafSpy.callCount - callsBefore
      rafSpy.restore()

      // Should use at most a few rAF calls, not one per element
      expect(rafCallsFromScan).to.be.lessThan(5)
      expect(onDefine).to.be.callCount(1)
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

  describe('observer lifecycle', () => {
    it('re-observes for definitions registered after everything has resolved', async () => {
      const onFirst = spy()
      lazyDefine('idle-first-element', onFirst)
      await fixture(html`<idle-first-element></idle-first-element>`)
      await animationFrame()
      // All pending definitions have resolved, so the observer disconnects here.
      expect(onFirst).to.be.callCount(1)

      // A later registration must re-establish observation of newly added nodes.
      const onSecond = spy()
      lazyDefine('idle-second-element', onSecond)
      await fixture(html`<idle-second-element></idle-second-element>`)
      await animationFrame()

      expect(onSecond).to.be.callCount(1)
    })

    it('does no work when observe() is called with no pending definitions', async () => {
      // Drain any pending state from prior expectations.
      await animationFrame()

      const rafSpy = spy(window, 'requestAnimationFrame')
      // core.ts calls observe() for every shadow-root controller on connect; it
      // must be free when nothing is waiting to be lazily defined.
      observe(document)
      const scheduled = rafSpy.callCount
      rafSpy.restore()

      expect(scheduled).to.equal(0)
    })
  })

  describe('race condition prevention', () => {
    it('does not fire callbacks multiple times from concurrent scans', async () => {
      const onDefine = spy()
      lazyDefine('race-test-element', onDefine)

      // Create multiple elements to trigger multiple scans
      await fixture(html`<race-test-element></race-test-element>`)
      await fixture(html`<race-test-element></race-test-element>`)

      await animationFrame()
      await animationFrame()

      // Should only be called once despite multiple elements triggering scans
      expect(onDefine).to.be.callCount(1)
    })
  })

  describe('late registration', () => {
    it('runs a callback registered for a tag that already resolved', async () => {
      const onDefine1 = spy()
      const onDefine2 = spy()

      // Register and trigger first callback
      lazyDefine('late-reg-element', onDefine1)
      await fixture(html`<late-reg-element></late-reg-element>`)
      await animationFrame()
      expect(onDefine1).to.be.callCount(1)

      // Register a second callback after the element already exists in the DOM
      lazyDefine('late-reg-element', onDefine2)
      await animationFrame()

      // The late callback should still run
      expect(onDefine2).to.be.callCount(1)
    })
  })

  describe('error handling', () => {
    it('handles callback errors without breaking other callbacks', async () => {
      const onDefine1 = spy(() => {
        throw new Error('Test error')
      })
      const onDefine2 = spy()

      const errors: unknown[] = []
      const reportErrorStub = stub(globalThis, 'reportError').callsFake((err: unknown) => errors.push(err))

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
        reportErrorStub.restore()
      }
    })
  })

  describe('redundant observe calls', () => {
    it('does not observe the same target multiple times', async () => {
      const onDefine = spy()
      const el = await fixture(html`<div></div>`)
      const shadowRoot = el.attachShadow({mode: 'open'})

      lazyDefine('redundant-test-element', onDefine)

      // Observe the same shadow root multiple times
      observe(shadowRoot)
      observe(shadowRoot)
      observe(shadowRoot)

      // eslint-disable-next-line github/unescaped-html-literal
      shadowRoot.innerHTML = '<redundant-test-element></redundant-test-element>'

      await animationFrame()

      // Should still only be called once
      expect(onDefine).to.be.callCount(1)
    })
  })

  describe('large scale scanning', () => {
    it('resolves a tag efficiently when many are registered', async () => {
      const onDefine = spy()
      const defs: Record<string, () => void> = {'needle-el': onDefine}
      const tags = ['needle-el']
      for (let i = 0; i < 300; i++) {
        const tag = `bulk-el-${i}`
        defs[tag] = () => {}
        tags.push(tag)
      }
      lazyDefine(defs)

      // Provide an element for every registered tag so all definitions resolve
      // (and module state drains) instead of leaking into later tests.
      const container = document.createElement('div')
      for (const tag of tags) container.appendChild(document.createElement(tag))
      const host = await fixture(html`<div></div>`)
      host.appendChild(container)

      await animationFrame()
      await animationFrame()

      expect(onDefine).to.be.callCount(1)
    })

    it('finds a target deep inside a large subtree', async () => {
      const onDefine = spy()
      lazyDefine('deep-needle-el', onDefine)

      const container = document.createElement('div')
      for (let i = 0; i < 5000; i++) container.appendChild(document.createElement('span'))
      container.appendChild(document.createElement('deep-needle-el'))

      const host = await fixture(html`<div></div>`)
      host.appendChild(container)

      // May span more than one frame if the scan is time-sliced.
      for (let i = 0; i < 20 && onDefine.callCount === 0; i++) await animationFrame()

      expect(onDefine).to.be.callCount(1)
    })
  })
})
