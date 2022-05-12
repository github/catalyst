import {expect, fixture, html} from '@open-wc/testing'
import {replace, fake} from 'sinon'
import {autoShadowRoot} from '../src/auto-shadow-root.js'

describe('autoShadowRoot', () => {
  class ShadowRootTestElement extends HTMLElement {
    declare shadowRoot: ShadowRoot
  }
  window.customElements.define('shadowroot-test-element', ShadowRootTestElement)

  let instance: ShadowRootTestElement
  beforeEach(async () => {
    instance = await fixture(html`<shadowroot-test-element />`)
  })

  it('automatically declares shadowroot for elements with `template[data-shadowroot]` children', async () => {
    instance = await fixture(html`<shadowroot-test-element>
      <template data-shadowroot="open">Hello World</template>
    </shadowroot-test-element>`)
    autoShadowRoot(instance)

    expect(instance).to.have.property('shadowRoot').not.equal(null)
    expect(instance.shadowRoot.textContent).to.equal('Hello World')
  })

  it('does not attach shadowroot without a template`data-shadowroot` child', async () => {
    instance = await fixture(html`<shadowroot-test-element>
      <template data-notshadowroot="open">Hello</template>
      <div data-shadowroot="open">World</div>
    </shadowroot-test-element>`)

    autoShadowRoot(instance)

    expect(instance).to.have.property('shadowRoot').equal(null)
  })

  it('does not attach shadowroots which are not direct children of the element', async () => {
    instance = await fixture(html`<shadowroot-test-element>
      <div>
        <template data-shadowroot="open">Hello World</template>
      </div>
    </shadowroot-test-element>`)

    autoShadowRoot(instance)

    expect(instance).to.have.property('shadowRoot').equal(null)
  })

  it('attaches shadowRoot nodes open by default', async () => {
    instance = await fixture(html`<shadowroot-test-element>
      <template data-shadowroot>Hello World</template>
    </shadowroot-test-element>`)

    autoShadowRoot(instance)

    expect(instance).to.have.property('shadowRoot').not.equal(null)
    expect(instance.shadowRoot.textContent).to.equal('Hello World')
  })

  it('attaches shadowRoot nodes closed if `data-shadowroot` is `closed`', async () => {
    instance = await fixture(html`<shadowroot-test-element>
      <template data-shadowroot="closed">Hello World</template>
    </shadowroot-test-element>`)
    let shadowRoot: ShadowRoot | null = null
    replace(
      instance,
      'attachShadow',
      fake((...args) => {
        shadowRoot = Element.prototype.attachShadow.apply(instance, args)
        return shadowRoot
      })
    )

    autoShadowRoot(instance)

    expect(instance).to.have.property('shadowRoot').equal(null)
    expect(instance.attachShadow).to.have.been.calledOnceWith({mode: 'closed'})
    expect(shadowRoot!.textContent).to.equal('Hello World')
  })
})
