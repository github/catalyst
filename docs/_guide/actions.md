---
version: 1
chapter: 5
title: Actions
subtitle: Binding Events
---

Catalyst Components automatically bind actions upon instantiation. Automatically as part of the `connectedCallback`, a component will search for any children with the `data-action` attribute, and bind events based on the value of this attribute. Any _public method_ on a Controller can be bound to via `data-action`.

{% capture callout %}
Remember! Actions are _automatically_ bound using the `@controller` decorator. There's no extra JavaScript code needed.
{% endcapture %}{% include callout.md %}

### Example

<div class="d-flex my-4">
  <div class="">

<!-- annotations
data-action "click.*": Will call `greetSomeone()` when clicked
-->

```html
<hello-world>
  <input
    data-target="hello-world.name"
    type="text"
  >

  <button
    data-action="click:hello-world#greetSomeone">
    Greet Someone
  </button>

  <span
    data-target="hello-world.output">
  </span>
</hello-world>
```

  </div>
  <div class="ml-4">

<!-- annotations
greetSomeone: All public methods can be called with `data-action`
-->

```js
import { controller, target } from "@github/catalyst"

@controller
class HelloWorldElement extends HTMLElement {
  @target name: HTMLElement
  @target output: HTMLElement

  greetSomeone() {
    this.output.textContent =
      `Hello, ${this.name.value}!`
  }
}
```

  </div>
</div>

### Actions Syntax

The actions syntax follows a pattern of `event:controller#method`.

 - `event` must be the name of a [_DOM Event_](https://developer.mozilla.org/en-US/docs/Web/Events), e.g. `click`.
 - `:` is the required delimiter between the `event` and `controller`.
 - `controller` must be the name of a controller ascendant to the element.
 - `#` is the required delimieter between the `controller` and `method`.
 - `method` (optional) must be a _public_ _method_ attached to a controller's prototype. Static methods will not work.

If method is not supplied, it will default to `handleEvent`.

Some examples of Actions Syntax:

- `click:my-element#foo` -> `click` events will call `foo` on `my-element` elements.
- `submit:my-element#foo` -> `submit` events will call `foo` on `my-element` elements.
- `click:user-list` -> `click` events will call `handleEvent` on `user-list` elements.
- `click:user-list#` -> `click` events will call `handleEvent` on `user-list` elements.
- `click:top-header-user-profile#` -> `click` events will call `handleEvent` on `top-header-user-profile` elements.
- `nav:keydown:user-list` -> `navigation:keydown` events will call `handleEvent` on `user-list` elements.

### Multiple Actions

Multiple actions can be bound to multiple events, methods, and controllers. For example:

<!-- annotations
data-action: Fires all of these methods depending on the event
-->

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
        click:hello-world#greetSomeone
        click:analytics-tracking#click
        mouseover:analytics-tracking#hover
      "
    >
      Greet Someone
    </button>
  </hello-world>
</analytics-tracking>
```

### Custom Events

A Controller may emit custom events, which may be listened to by other Controllers using the same Actions Syntax. There is no extra syntax needed for this. For example a `lazy-loader` Controller might dispatch a `loaded` event, once its contents are loaded, and other controllers can listen to this event:

<!-- annotations
data-action "loaded: Calls enable() on the `loaded` custom event
-->

```html
<hover-card disabled>
  <lazy-loader data-url="/user/1" data-action="loaded:hover-card#enable">
    <loading-spinner>
  </lazy-loader>
</hover-card>
```

<!-- annotations
this . dispatchEvent . new CustomEvent . . loaded . . : Dispatches custom "loaded" event
enable: All public methods can be called with `data-action`
-->

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
class HoverCard extends HTMLElement {

  enable() {
    this.disabled = false
  }

}
```

### Targets and "ShadowRoots"

Custom elements can create encapsulated DOM trees known as "Shadow" DOM. Catalyst actions support Shadow DOM by traversing the `shadowRoot`, if present, and also automatically watching shadowRoots for changes; auto-binding new elements as they are added.

### What about without Decorators?

If you're using decorators, then the `@controller` decorator automatically handles binding of actions to a Controller.

If you're not using decorators, then you'll need to call `bind(this)` somewhere inside of `connectedCallback()`.

```js
import {bind} from '@github/catalyst'

class HelloWorldElement extends HTMLElement {
  connectedCallback() {
    bind(this)
  }
}
```

### Binding dynamically added actions

Catalyst automatically listens for elements that are dynamically injected into the DOM, and will bind any element's `data-action` attributes. It does this by calling `listenForBind(controller.ownerDocument)`. If for some reason you need to observe other documents (such as mutations within an iframe), then you can call the `listenForBind` manually, passing a `Node` to listen to DOM mutations on.

```js
import {listenForBind} from '@github/catalyst'

@controller
class HelloWorldElement extends HTMLElement {
  @target iframe: HTMLIFrameElement

  connectedCallback() {
    // listenForBind(this.ownerDocument) is automatically called.

    listenForBind(this.iframe.document.body)
  }
}
```
