---
chapter: 8
subtitle: Rendering HTML subtrees
---

Sometimes it's necessary to render an HTML subtree as part of a component. This can be especially useful if a component is driving complex UI that is only interactive with JS.

{% capture callout %}
Remember to _always_ make your JavaScript progressively enhanced, where possible. Using JS to render large portions of the UI, that could be rendered server-side is an anti-pattern; it can be difficult for users to interact with - especially users who disable JS, or when JS fails to load, or those using assistive technologies. Rendering on the client can also impact the [CLS Web Vital](https://web.dev/cls/).
{% endcapture %}{% include callout.md %}

By leveraging the native [`ShadowDOM`](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM) feature, Catalyst components can render complex sub-trees, fully encapsulated from the rest of the page.

[Actions]({{ site.baseurl }}/guide/actions) and [Targets]({{ site.baseurl }}/guide/targets) all work within an elements ShadowRoot.

You can also leverage the [declarative shadow DOM](https://web.dev/declarative-shadow-dom/) and render a template inline to your HTML, which will automatically be attached (this may require a polyfill for browsers which are yet to support this feature).

### Example

```html
<hello-world>
  <template shadowroot="open">
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

{% capture callout %}
Remember that _all_ instances of your controller _must_ add the `<template shadowroot>` HTML. If an instance does not have the `<template data-shadowroot>` as a direct child, then the shadow DOM won't be rendered for it!
{% endcapture %}{% include callout.md %}


It is also possible to attach a shadowRoot to your element during the `connectedCallback`, like so:

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

  connectedCallback() {
    this.attachShadow({ mode: 'open' }).innerHTML = `<p>
      Hello <span data-target="hello-world.nameEl">World</span>
    </p>`
  }
}
```

### Updating a Template element using JS templates

Sometimes you wont have a template that is server rendered, and instead want to make a template using JS. Catalyst does not support this out of the box, but it is possible to use another library: `@github/jtml`. This library can be used to write declarative templates using JS. Let's re-work the above example using `@github/jtml`:

```typescript
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
