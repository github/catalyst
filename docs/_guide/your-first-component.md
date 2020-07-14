---
subtitle: Building an HTMLElement
chapter: 2
---

### Catalyst's `@controller` decorator

Catalyst's `@controller` decorator lets you create Custom Elements with virtually no boilerplate, by automatically calling `customElements.register`, and by adding ["Actions"](/guide/actions) and ["Targets"](/guide/targets) features described later. Using TypeScript (with `decorators` support enabled), simply add `@controller` to the top of your class:

```js
import {controller} from '@github/catalyst'
@controller
class HelloWorldElement extends HTMLElement {
  connectedCallback() {
    this.innerHTML = 'Hello World!'
  }
}
```
<br>

Catalyst will automatically convert the classes name; removing the trailing `Element` suffix and lowercasing all capital letters, separating them with a dash.

By convention Catalyst controllers end in `Element`; Catalyst will omit this when generating a tag name. The `Element` suffix is _not_ required - just convention. All examples in this guide use `Element` suffixed names.

<div class="d-flex border rounded-1 my-3 box-shadow-medium">
  <span class="d-flex bg-blue text-white rounded-left-1 p-3">
    <svg width="24" viewBox="0 0 14 16" class="octicon octicon-info" aria-hidden="true">
      <path
        fill-rule="evenodd"
        d="M6.3 5.69a.942.942 0 0 1-.28-.7c0-.28.09-.52.28-.7.19-.18.42-.28.7-.28.28 0 .52.09.7.28.18.19.28.42.28.7 0 .28-.09.52-.28.7a1 1 0 0 1-.7.3c-.28 0-.52-.11-.7-.3zM8 7.99c-.02-.25-.11-.48-.31-.69-.2-.19-.42-.3-.69-.31H6c-.27.02-.48.13-.69.31-.2.2-.3.44-.31.69h1v3c.02.27.11.5.31.69.2.2.42.31.69.31h1c.27 0 .48-.11.69-.31.2-.19.3-.42.31-.69H8V7.98v.01zM7 2.3c-3.14 0-5.7 2.54-5.7 5.68 0 3.14 2.56 5.7 5.7 5.7s5.7-2.55 5.7-5.7c0-3.15-2.56-5.69-5.7-5.69v.01zM7 .98c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.12-7-7 3.14-7 7-7z"
      />
    </svg>
  </span>
  <div class="p-3">
  
Remember! A class name _must_ include at least two CamelCased words (not including the `Element` suffix). One-word elements will raise exceptions. Example of good names: `UserListElement`, `SubTaskElement`, `PagerContainerElement`

  </div>
</div>


### What does `@controller` do?

The `@controller` decorator doesn't do all that much. Catalyst components are just "Custom Elements" under the hood, and the `@controller` decorator saves you writing some boilerplate that you'd otherwise have to write by hand. Specifically the `@controller` decorator:

 - Derives a tag name based on your class name, removing the trailing `Element` suffix and lowercasing all capital letters, separating them with a dash.
 - Calls `window.customElements.register` with the newly derived tag name and your class.
 - Injects a call to `bind(this)` inside of the `connectedCallback()` of your class; this ensures that as your element connects it picks up any `data-action` handlers. See [actions](/guide/actions) for more on this.
 
You can do all of this manually; for example here's the above `HelloWorldElement`, written without the `@controller` annotation:

```js
import {bind} from '@github/catalyst'
class HelloWorldElement extends HTMLElement {
  connectedCallback() {
    bind(this)
    this.innerHTML = 'Hello World!'
  }
}
window.customElements.register('hello-world', HelloWorldElement)
```

The Catalyst version isn't all that different, it's just that we have the `@controller` decorator to save on some of the boilerplate.

### What about without TypeScript Decorators?

If you don't want to use TypeScript decorators, you can use `controller` as a regular function, and just pass it your class:

```js
controller(
  class HelloWorldElement extends HTMLElement {
    //...
  }
)
```
<br>
