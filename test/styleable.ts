import {expect, fixture} from '@open-wc/testing'
import {style, stylable} from '../src/styleable.js'
const html = String.raw

type TemplateString = {raw: readonly string[] | ArrayLike<string>}
const css = (strings: TemplateString, ...values: unknown[]): CSSStyleSheet => {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(String.raw(strings, ...values))
  return sheet
}

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
      this.attachShadow({mode: 'open'}).innerHTML = html`<p>Hello</p>`
    }
  }
  window.customElements.define('stylable-test', StylableTest)

  it('adoptes styles into shadowRoot', async () => {
    const instance = await fixture<StylableTest>(html`<stylable-test></stylable-test>`)
    expect(instance.foo).to.be.instanceof(CSSStyleSheet)
    expect(instance.bar).to.be.instanceof(CSSStyleSheet)
    expect(instance.shadowRoot!.adoptedStyleSheets).to.eql([instance.foo, instance.bar])
  })

  it('throws an error when trying to set stylesheet', async () => {
    const instance = await fixture<StylableTest>(html`<stylable-test></stylable-test>`)
    expect(() => (instance.foo = css``)).to.throw(/Cannot set @style/)
  })
})
