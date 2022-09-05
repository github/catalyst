import {expect, fixture, html} from '@open-wc/testing'
import {style, css, stylable} from '../src/stylable.js'

describe('Styleable', () => {
  const globalCSS = ({color}: {color: string}) =>
    css`
      :host {
        color: ${color};
      }
    `

  @stylable
  class StylableTest extends HTMLElement {
    @style foo = css`
      body {
        display: block;
      }
    `
    @style bar = globalCSS({color: 'rgb(255, 105, 180)'})

    constructor() {
      super()
      this.attachShadow({mode: 'open'}).innerHTML = '<p>Hello</p>'
    }
  }
  window.customElements.define('stylable-test', StylableTest)

  it('adoptes styles into shadowRoot', async () => {
    const instance = await fixture<StylableTest>(html`<stylable-test></stylable-test>`)
    expect(instance.foo).to.be.instanceof(CSSStyleSheet)
    expect(instance.bar).to.be.instanceof(CSSStyleSheet)
    expect(instance.shadowRoot!.adoptedStyleSheets).to.eql([instance.foo, instance.bar])
  })

  it('updates stylesheets that get recomputed', async () => {
    const instance = await fixture<StylableTest>(html`<stylable-test></stylable-test>`)
    expect(getComputedStyle(instance.shadowRoot!.children[0]!).color).to.equal('rgb(255, 105, 180)')
    globalCSS({color: 'rgb(0, 0, 0)'})
    expect(getComputedStyle(instance.shadowRoot!.children[0]!).color).to.equal('rgb(0, 0, 0)')
  })

  it('throws an error when trying to set stylesheet', async () => {
    const instance = await fixture<StylableTest>(html`<stylable-test></stylable-test>`)
    expect(() => (instance.foo = css``)).to.throw(/Cannot set @style/)
  })

  describe('css', () => {
    it('returns the same CSSStyleSheet for subsequent calls from same template string', () => {
      expect(css``).to.not.equal(css``)
      const mySheet = () => css``
      expect(mySheet()).to.equal(mySheet())
    })
  })
})
