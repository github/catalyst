---
chapter: 6
subtitle: Binding Events
---

Catalyst Components, upon creation, will search for any children with the `data-action` attribute, and bind events based on the value of this attribute. Any _public method_ on a Controller can be bound to via `data-action`.

### Example

<div class="d-flex my-4">
  <div class="">

```html
<hello-controller>
  <input
    data-target="hello-controller.name"
    type="text"
  >

  <button
    data-action="click:hello-controller#greet">
    Greet
  </button>

  <span
    data-target="hello-controller.output">
  </span>
</div>
```

  </div>
  <div class="ml-4">

```js
import { controller, target } from "@catalyst/ts"

@controller
class HelloController extends Controller {
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
<analytics-controller>
  <hello-controller>
    <input
      data-target="hello-controller.name"
      data-action="
        input:hello-controller#validate
        blur:hello-controller#validate
        focus:analytics-controller#hover
      "
      type="text"
    >

    <button
      data-action="
        click:hello-controller#greet
        click:analytics-controller#click
        hover:analytics-controller#hover
      "
    >
      Greet
    </button>
  </hello-controller>
</analytics-controller>
```

### Custom Events

A Controller may emit custom events, which may be listened to by other Controllers using the same Actions Syntax. There is no extra syntax needed for this. For example a `lazy-controller` may dispatch a `loaded` event, once its contents are loaded, and other controllers can listen to this event:

```html
<hover-card disabled>
  <lazy-controller data-url="/user/1" data-action="loaded:hover-card#enable">
    <loading-spinner>
  </lazy-controller>
</hover-card>
```

### Private Methods

Actions can always be bound to any method that is available on the Controller's prototype. If you need a method on a class that _must not_ be invoked within Actions, then you can instead use a [_class field_](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Class_fields) or a [_private class field_](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Class_fields#Private_fields).

```js
@controller
class HelloController extends HTMLElement {

  hidden = () => {
    console.log('data-action cannot call this hidden method, but other JavaScript can!')
  }

  #reallyHidden = () => {
    console.log('data-action cannot call this hidden method, neither can other JavaScript!')
  }

}
```


### How are actions registered?

If you're using decorators, then the `@controller` decorator automatically handles binding of actions to a Controller.

If you're not using decorators, then you'll need to call `bindEvents(this)` somewhere inside of `connectedCallback()`.
