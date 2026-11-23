import {expect, fixture, html} from '@open-wc/testing'
import {controller} from '../../src/controller.js'
import {attr} from '../../src/attr.js'

// web-test-runner-standard.config.js compiles this file with `useDefineForClassFields: false`, so TypeScript assigns
// decorated fields with `this.name = value` instead of defining them.
describe('Attr (standard decorators, set semantics)', () => {
  it('does not pass a field without a value to a built-in setter of the same name', async () => {
    @controller
    class SetSemanticsTitleElement extends HTMLElement {
      @attr title!: string
    }
    const instance = await fixture<SetSemanticsTitleElement>(html`<set-semantics-title></set-semantics-title>`)
    expect(instance).not.to.have.attribute('title')
    expect(instance).to.have.attribute('data-title', '')
    expect(instance.title).to.equal('')
  })

  it('does not pass a field value to a built-in setter of the same name', async () => {
    @controller
    class SetSemanticsValueElement extends HTMLElement {
      @attr title = 'value'
    }
    const instance = await fixture<SetSemanticsValueElement>(html`<set-semantics-value></set-semantics-value>`)
    expect(instance).not.to.have.attribute('title')
    expect(instance).to.have.attribute('data-title', 'value')
  })

  it('keeps values set before upgrade through a built-in accessor', async () => {
    @controller
    class SetSemanticsPreUpgradeTitleElement extends HTMLElement {
      @attr title!: string
    }
    expect(SetSemanticsPreUpgradeTitleElement).to.exist
    const template = document.createElement('template')
    template.content.append(template.content.ownerDocument.createElement('set-semantics-pre-upgrade-title'))
    const clone = template.content.firstElementChild!.cloneNode() as SetSemanticsPreUpgradeTitleElement
    clone.title = 'set before upgrade'
    const container = await fixture(html`<div></div>`)
    container.append(clone)
    expect(clone).to.have.attribute('data-title', 'set before upgrade')
  })

  it('keeps read-only values set before upgrade on fields without a value', async () => {
    @controller
    class SetSemanticsReadonlyElement extends HTMLElement {
      @attr runner!: string
    }
    expect(SetSemanticsReadonlyElement).to.exist
    const template = document.createElement('template')
    template.content.append(template.content.ownerDocument.createElement('set-semantics-readonly'))
    const clone = template.content.firstElementChild!.cloneNode() as SetSemanticsReadonlyElement
    Object.defineProperty(clone, 'runner', {value: 'before', configurable: true})
    const container = await fixture(html`<div></div>`)
    container.append(clone)
    expect(clone).to.be.instanceOf(SetSemanticsReadonlyElement)
    expect(clone).to.have.attribute('data-runner', 'before')
  })

  it('keeps values set before upgrade on fields without a value', async () => {
    @controller
    class SetSemanticsPreUpgradeElement extends HTMLElement {
      @attr runner!: string
    }
    expect(SetSemanticsPreUpgradeElement).to.exist
    const template = document.createElement('template')
    template.content.append(template.content.ownerDocument.createElement('set-semantics-pre-upgrade'))
    const clone = template.content.firstElementChild!.cloneNode() as SetSemanticsPreUpgradeElement
    clone.runner = 'Linux 2-core'
    const container = await fixture(html`<div></div>`)
    container.append(clone)
    expect(clone.runner).to.equal('Linux 2-core')
    expect(clone).to.have.attribute('data-runner', 'Linux 2-core')
  })
})
