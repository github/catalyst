---
chapter: 6
subtitle: Binding Events
---

Catalyst Components automatically bind actions upon instantiation. Automatically as part of the `connectedCallback`, a component will search for any children with the `data-action` attribute, and bind events based on the value of this attribute. Any _public method_ on a Controller can be bound to via `data-action`.

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

Remember! Actions are _automatically_ bound using the `@controller` decorator. There's no extra JavaScript code needed.

  </div>
</div>

### Example

<div class="d-flex my-4">
  <div class="">

```html
<hello-world>
  <input
    data-target="hello-world.name"
    type="text"
  >

  <button
    data-action="click:hello-world#greet">
    Greet
  </button>

  <span
    data-target="hello-world.output">
  </span>
</hello-world>
```

  </div>
  <div class="ml-4">

```js
import { controller, target } from "@github/catalyst"

@controller
class HelloWorldElement extends HTMLElement {
  @target nameTarget: HTMLElement
  @target outputTarget: HTMLElement

  greet() {
    this.outputTarget.textContent =
      `Hello, ${this.nameTarget.value}!`
  }
}
```

  </div>
</div>

### Actions Syntax

The actions syntax follows a pattern of `event:controller#method`.

 - `event` must be the name of a [_DOM Event_](https://developer.mozilla.org/en-US/docs/Web/Events), e.g. `click`.
 - `controller` must be the name of a controller ascendant to the element.
 - `method` must be a _public_ _method_ attached to a controller's prototype. Static methods will not work.

### Multiple Actions

Multiple actions can be bound to multiple events, methods, and controllers. For example:

```html
<analytics-tracking>
  <hello-world>
    <input
      data-target="hello-world.name"
      data-action="
        input:hello-world#validate
        blur:hello-world#validate
        focus:analytics-tracking#focus
      "
      type="text"
    >

    <button
      data-action="
        click:hello-world#greet
        click:analytics-tracking#click
        hover:analytics-tracking#hover
      "
    >
      Greet
    </button>
  </hello-world>
</analytics-tracking>
```

### Custom Events

A Controller may emit custom events, which may be listened to by other Controllers using the same Actions Syntax. There is no extra syntax needed for this. For example a `lazy-loader` Controller might dispatch a `loaded` event, once its contents are loaded, and other controllers can listen to this event:

```html
<hover-card disabled>
  <lazy-loader data-url="/user/1" data-action="loaded:hover-card#enable">
    <loading-spinner>
  </lazy-loader>
</hover-card>
```

```js
import {controller} from '@github/catalyst'

@controller
class LazyLoader extends HTMLElement {

  connectedCallback() {
    this.innerHTML = await (await fetch(this.dataset.url)).text()
    this.dispatchEvent(new CustomEvent('loaded'))
  }

}

@controller
class HoverCard extenda HTMLElement {

  enable() {
    this.disabled = false
  }

}
```

### What about without Decorators?

If you're using decorators, then the `@controller` decorator automatically handles binding of actions to a Controller.

If you're not using decorators, then you'll need to call `bind(this)` somewhere inside of `connectedCallback()`.

```
import {bind} from '@github/catalyst'

class HelloWorldElement extends HTMLElement {

  connectedCallback() {
    bind(this)
  }

}
```
