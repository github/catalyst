---
version: 1
chapter: 2
title: Your First Component
subtitle: Building an HTMLElement
---

### Catalyst's `@controller` decorator

Catalyst's `@controller` decorator lets you create Custom Elements with virtually no boilerplate, by automatically calling `customElements.register`, and by adding ["Actions"]({{ site.baseurl }}/guide/actions) and ["Targets"]({{ site.baseurl }}/guide/targets) features described later. Using TypeScript (with `decorators` support enabled), simply add `@controller` to the top of your class:

<!-- annotations
controller: This must be added to all Catalyst controllers.
extends HTMLElement: This must be added to all Catalyst controllers.
connectedCallback: This runs when the element is added to the DOM | {{ site.baseurl }}/guide/lifecycle-hooks/#codeconnectedcallbackcode
-->

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

Catalyst controllers can end in `Element`, `Controller`, or `Component` and Catalyst will remove this suffix when generating a tag name. Adding one of these suffixes is _not_ required - just convention. All examples in this guide use `Element` suffixed names (see our [convention note on this for more]({{ site.baseurl }}/guide/conventions#suffix-your-controllers-consistently-for-symmetry)).

{% capture callout %}
Remember! A class name _must_ include at least two CamelCased words (not including the `Element`, `Controller` or `Component` suffix). One-word elements will raise exceptions. Example of good names: `UserListElement`, `SubTaskController`, `PagerContainerComponent`
{% endcapture %}{% include callout.md %}


### What does `@controller` do?

The `@controller` decorator ties together the various other decorators within Catalyst, plus a few extra conveniences such as automatically registering the element, which saves you writing some boilerplate that you'd otherwise have to write by hand. Specifically the `@controller` decorator:

 - Derives a tag name based on your class name, removing the trailing `Element` suffix and lowercasing all capital letters, separating them with a dash.
 - Calls `window.customElements.define` with the newly derived tag name and your class.
 - Calls `defineObservedAttributes` with the class to add map any `@attr` decorators. See [attrs]({{ site.baseurl }}/guide/attrs) for more on this.
 - Injects the following code inside of the `connectedCallback()` function of your class:
   - `bind(this)`; ensures that as your element connects it picks up any `data-action` handlers. See [actions]({{ site.baseurl }}/guide/actions) for more on this.
   - `autoShadowRoot(this)`; ensures that your element loads any `data-shadowroot` templates. See [rendering]({{ site.baseurl }}/guide/rendering) for more on this.
   - `initializeAttrs(this)`; ensures that your element binds any `data-*` attributes to props. See [attrs]({{ site.baseurl }}/guide/attrs) for more on this.
 
You can do all of this manually; for example here's the above `HelloWorldElement`, written without the `@controller` annotation:

```js
import {bind, autoShadowRoot, initializeAttrs, defineObservedAttributes} from '@github/catalyst'
class HelloWorldElement extends HTMLElement {
  connectedCallback() {
    autoShadowRoot(this)
    initializeAttrs(this)
    this.innerHTML = 'Hello World!'
    bind(this)
  }
}
defineObservedAttributes(HelloWorldElement)
window.customElements.define('hello-world', HelloWorldElement)
```

The `@controller` decorator saves on having to write this boilerplate for each element.

### What about without TypeScript Decorators?

If you don't want to use TypeScript decorators, you can use `controller` as a regular function by passing it to your class:

```js
import {controller} from '@github/catalyst'

controller(
  class HelloWorldElement extends HTMLElement {
    //...
  }
)
```
<br>
