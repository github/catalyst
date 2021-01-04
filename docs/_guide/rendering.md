---
chapter: 7
subtitle: Rendering HTML subtrees
---

Sometimes it's necessary to render an HTML subtree as part of a component. This can be especially useful if a component is driving complex UI that is only interactive with JS.

<div class="d-flex border rounded-1 my-3 box-shadow-medium">
  <span class="d-flex flex-items-center bg-blue text-white rounded-left-1 p-3">
    <svg width="24" height="24" viewBox="0 0 14 16" class="octicon octicon-info" aria-hidden="true">
      <path
        fill-rule="evenodd"
        d="M6.3 5.69a.942.942 0 0 1-.28-.7c0-.28.09-.52.28-.7.19-.18.42-.28.7-.28.28 0 .52.09.7.28.18.19.28.42.28.7 0 .28-.09.52-.28.7a1 1 0 0 1-.7.3c-.28 0-.52-.11-.7-.3zM8 7.99c-.02-.25-.11-.48-.31-.69-.2-.19-.42-.3-.69-.31H6c-.27.02-.48.13-.69.31-.2.2-.3.44-.31.69h1v3c.02.27.11.5.31.69.2.2.42.31.69.31h1c.27 0 .48-.11.69-.31.2-.19.3-.42.31-.69H8V7.98v.01zM7 2.3c-3.14 0-5.7 2.54-5.7 5.68 0 3.14 2.56 5.7 5.7 5.7s5.7-2.55 5.7-5.7c0-3.15-2.56-5.69-5.7-5.69v.01zM7 .98c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.12-7-7 3.14-7 7-7z"
      />
    </svg>
  </span>
  <div class="p-3">

Remember to _always_ make your JavaScript progressively enhanced, where possible. Using JS to render large portions of the UI, that could be rendered server-side is an anti-pattern; it can be difficult for users to interact with - especially users who disable JS, or when JS fails to load, or those using assistive technologies. Rendering on the client can also impact the [CLS Web Vital](https://web.dev/cls/).

  </div>
</div>

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

<div class="d-flex border rounded-1 my-3 box-shadow-medium">
  <span class="d-flex flex-items-center bg-blue text-white rounded-left-1 p-3">
    <svg width="24" height="24" viewBox="0 0 14 16" class="octicon octicon-info" aria-hidden="true">
      <path
        fill-rule="evenodd"
        d="M6.3 5.69a.942.942 0 0 1-.28-.7c0-.28.09-.52.28-.7.19-.18.42-.28.7-.28.28 0 .52.09.7.28.18.19.28.42.28.7 0 .28-.09.52-.28.7a1 1 0 0 1-.7.3c-.28 0-.52-.11-.7-.3zM8 7.99c-.02-.25-.11-.48-.31-.69-.2-.19-.42-.3-.69-.31H6c-.27.02-.48.13-.69.31-.2.2-.3.44-.31.69h1v3c.02.27.11.5.31.69.2.2.42.31.69.31h1c.27 0 .48-.11.69-.31.2-.19.3-.42.31-.69H8V7.98v.01zM7 2.3c-3.14 0-5.7 2.54-5.7 5.68 0 3.14 2.56 5.7 5.7 5.7s5.7-2.55 5.7-5.7c0-3.15-2.56-5.69-5.7-5.69v.01zM7 .98c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.12-7-7 3.14-7 7-7z"
      />
    </svg>
  </span>
  <div class="p-3">

Remember that _all_ instances of your controller _must_ add the `<template data-shadowroot>` HTML. If an instance does not have the `<template data-shadowroot>` as a direct child, then the shadow DOM won't be rendered for it!

  </div>
</div>

### Updating a Template element using JS templates

Sometimes you wont have a template that is server rendered, and instead want to make a template using JS. Catalyst does not support this out of the box, but it is possible to use another library: `@github/jtml`. This library can be used to write declarative templates using JS. Let's re-work the above example using `@github/jtml`:

```typescript
import { controller, target } from "@github/catalyst"
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

Here, instead of declaring our template in HTML, we can do so in JS, and achieve exactly the same effect. We aren't using `@targets` in this example, as there is a more direct way to handle the data; re-calling `update()` will efficiently update only the parts that change.
