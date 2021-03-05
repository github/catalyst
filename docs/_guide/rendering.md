---
chapter: 8
subtitle: Rendering HTML subtrees
---

Sometimes it's necessary to render an HTML subtree as part of a component. This can be especially useful if a component is driving complex UI that is only interactive with JS.

{% capture callout %}
Remember to _always_ make your JavaScript progressively enhanced, where possible. Using JS to render large portions of the UI, that could be rendered server-side is an anti-pattern; it can be difficult for users to interact with - especially users who disable JS, or when JS fails to load, or those using assistive technologies. Rendering on the client can also impact the [CLS Web Vital](https://web.dev/cls/).
{% endcapture %}{% include callout.md %}

By leveraging the native [`ShadowDOM`](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM) feature, Catalyst components can render complex sub-trees, fully encapsulated from the rest of the page.

Catalyst will automatically look for elements that match the `template[data-shadowroot]` selector, within your controller. If it finds one as a direct-child of your controller, it will use that to create a shadowRoot. 

Catalyst Controllers will search for a direct child of `template[data-shadowroot]` and load its contents as the `shadowRoot` of the element. [Actions]({{ site.baseurl }}/guide/actions) and [Targets]({{ site.baseurl }}/guide/targets) all work within an elements ShadowRoot.

### Example

```html
<hello-world>
  <template data-shadowroot>
    <p>
      Hello <span data-target="hello-world.nameEl">World</span>
    </p>
  </template>
</hello-world>
```
```typescript
import { controller, target } from "@github/catalyst"

@controller
class HelloWorldElement extends HTMLElement {
  @target nameEl: HTMLElement
  get name() {
    return this.nameEl.textContent
  }
  set name(value: string) {
    this.nameEl.textContent = value
  }
}
```

Providing the `<template data-shadowroot>` element as a direct child of the `hello-world` element tells Catalyst to render the templates contents automatically, and so all `HelloWorldElements` with this template will be rendered with the contents.

{% capture callout %}
Remember that _all_ instances of your controller _must_ add the `<template data-shadowroot>` HTML. If an instance does not have the `<template data-shadowroot>` as a direct child, then the shadow DOM won't be rendered for it!
{% endcapture %}{% include callout.md %}

### Updating a Template element using JS templates

Sometimes you wont have a template that is server rendered, and instead want to make a template using JS. Catalyst does not support this out of the box, but it is possible to use another library: `@github/jtml`. This library can be used to write declarative templates using JS. Let's re-work the above example using `@github/jtml`:

```
import { attr, controller } from "@github/catalyst"
import { html, render } from "@github/jtml"

@controller
class HelloWorldElement extends HTMLElement {
  @attr name = 'World'

  connectedCallback() {
    this.attachShadow({mode: 'open'})
  }

  attributeChangedCallback() {
    render(() => html`
      <div>
        Hello <span>${ this.name }</span>
      </div>`,
    this.shadowRoot!)
  }
}
```

Here, instead of declaring our template in HTML, we can do so in JS, and achieve exactly the same effect. We aren't using `@targets` in this example, as there is a more direct way to handle the data; relying on `attributeChangedCallback` which will efficiently update only the parts that change.

The same effect could be achieved without using `@attr` via:

```typescript
import { controller } from "@github/catalyst"
import { html, render } from "@github/jtml"

@controller
class HelloWorldElement extends HTMLElement {

  // Make `name` automatically update when changed
  #name = 'World'
  get name() {
    return this.#name
  }
  set name(value: string) {
    this.#name = value
    this.update()
  }

  connectedCallback() {
    this.attachShadow({mode: 'open'})
    this.update()
  }

  update() {
    render(() => html`
      <div>
        Hello <span>${ this.#name }</span>
      </div>`,
    this.shadowRoot!)
  }
}
```
