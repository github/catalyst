import {expect, fixture, html} from '@open-wc/testing'
import {fake, replace, restore} from 'sinon'
import {loadable} from '../src/loadable.js'

// function deferred<T>(): {promise: Promise<T>; resolve: (value: T) => void; reject: (error: Error) => void} {
//   let resolve!: (value: T) => void
//   let reject!: (error: Error) => void
//   const promise = new Promise<T>((res, rej) => {
//     resolve = res
//     reject = rej
//   })
//   return {promise, resolve, reject}
// }

describe('Loadable', () => {
  let promise: Promise<void>

  @loadable
  class LoadableTest extends HTMLElement {
    async load(response: Response) {
      response
    }
  }
  window.customElements.define('loadable-test', LoadableTest)

  beforeEach(() => {
    replace(window, 'fetch', fake.returns(Promise.resolve(new Response('Hi!'))))
    promise = new Promise(resolve => {
      replace(
        LoadableTest.prototype,
        'load',
        fake(async () => resolve())
      )
    })
  })

  afterEach(() => {
    restore()
  })

  describe('loadable', () => {
    it('does nothing when not given a `src` attribute', async () => {
      const instance = (await fixture(html`<loadable-test></loadable-test>`)) as LoadableTest
      expect(instance.load).to.have.callCount(0)
    })

    it('calls the `load` function eagerly when the `src` attribute is present', async () => {
      const instance = (await fixture(html`<loadable-test src="/foo"></loadable-test>`)) as LoadableTest
      await promise
      expect(instance.load).to.have.callCount(1)
    })

    it('calls the `load` function once the element is in the viewport when `loading=lazy`', async () => {
      const instance = (await fixture(
        html`<loadable-test hidden loading="lazy" src="/foo"></loadable-test>`
      )) as LoadableTest
      expect(instance.load).to.have.callCount(0)
      instance.hidden = false
      await promise
      expect(instance.load).to.have.callCount(1)
    })
  })
})
