---
subtitle: Building an HTMLElement
chapter: 3
---

### Catalyst's `@controller` decorator

Catalyst's `@controller` decorator lets you create Custom Elements with virtually no boilerplate, by automatically calling `customElements.register`, and by adding ["Actions"]({{ site.baseurl }}/guide/actions) and ["Targets"]({{ site.baseurl }}/guide/targets) features described later. Using TypeScript (with `decorators` support enabled), simply add `@controller` to the top of your class:

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

{% capture callout %}
Remember! A class name _must_ include at least two CamelCased words (not including the `Element` suffix). One-word elements will raise exceptions. Example of good names: `UserListElement`, `SubTaskElement`, `PagerContainerElement`
{% endcapture %}{% include callout.md %}


### What does `@controller` do?

The `@controller` decorator doesn't do all that much. Catalyst components are just "Custom Elements" under the hood, and the `@controller` decorator saves you writing some boilerplate that you'd otherwise have to write by hand. Specifically the `@controller` decorator:

 - Derives a tag name based on your class name, removing the trailing `Element` suffix and lowercasing all capital letters, separating them with a dash.
 - Calls `window.customElements.register` with the newly derived tag name and your class.
 - Injects a call to `bind(this)` inside of the `connectedCallback()` of your class; this ensures that as your element connects it picks up any `data-action` handlers. See [actions]({{ site.baseurl }}/guide/actions) for more on this.
 
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
