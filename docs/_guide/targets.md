---
chapter: 5
subtitle: Querying Descendants
---

One of the three [core patterns]({{ site.baseurl }}/guide/introduction#three-core-concepts-observe-listen-query) is Querying. In Catalyst, Targets are the preferred way to query. Targets use `querySelector` under the hood, but in a way that makes it a lot simpler to work with.

Catalyst Components are really just Web Components, so you could use `querySelector` or `querySelectorAll` to select descendants of the element. Targets avoid some of the problems of `querySelector`; they provide a more consistent interface, avoid coupling CSS classes or HTML tag names to JS, and they handle subtle issues like nested components. Targets are also a little more ergonomic to reuse in a class. We'd recommend using Targets over `querySelector` wherever you can.

To create a Target, use the `@target` decorator on a class field, and add the matching `data-target` attribute to your HTML, like so:

### Example

<div class="d-flex my-4">
  <div>
<!-- annotations
data-target ".*": This maps to the `@target output` property
-->

```html
<hello-world>
  <span
    data-target="hello-world.output">
  </span>
</hello-world>
```

  </div>
  <div class="ml-4">

<!-- annotations
@ target output: This maps to the data-target attribute
-->

```js
import { controller, target } from "@github/catalyst"

@controller
class HelloWorldElement extends HTMLElement {
  @target output: HTMLElement

  greet() {
    this.output.textContent = `Hello, world!`
  }
}
```

  </div>
</div>

### Target Syntax

The target syntax follows a pattern of `controller.target`.

 - `controller` must be the name of a controller ascendant to the element.
 - `target` must be the name matching that of a `@target` (or `@targets`) annotated field within the Controller code.

### Multiple Targets

{% capture callout %} 
Remember! There are two decorators available, `@target` which fetches only one `data-target` element, and `@targets` which fetches multiple `data-targets` elements!
{% endcapture %}{% include callout.md %}

The `@target` decorator will only ever return _one_ element, just like `querySelector`. If you want to get multiple Targets, you need the `@targets` decorator which works almost the same, but returns an Array of elements, and it searches the `data-targets` attribute (not `data-target`). 

Elements can be referenced as multiple targets, and targets may be referenced multiple times within the HTML:

<!-- annotations
data-targets ".*users": This maps to the `@targets users` property
data-target ".*read": This maps to the `@target read` property
data-target ".*write": This maps to the `@target write` property
-->

```html
<team-members>
  <user-list>
    <user-settings data-targets="user-list.users">
      <input type="checkbox" data-target="user-settings.read">
      <input type="checkbox" data-target="user-settings.write">
    </user-settings>
    <user-settings data-targets="user-list.users">
      <input type="checkbox" data-target="user-settings.read">
      <input type="checkbox" data-target="user-settings.write">
    </user-settings>
  </user-list>
</team-members>
```

<br>

<!-- annotations
@ targets users: This maps to the data-targets attribute
@ target read: This maps to the data-target attribute
@ target write: This maps to the data-target attribute
-->

```js
import { controller, target, targets } from "@github/catalyst"

@controller
class UserSettingsElement extends HTMLElement {
  @target read: HTMLInputElement
  @target write: HTMLInputElement

  valid() {
    // At least one checkbox must be checked!
    return this.read.checked || this.write.checked
  }
}

@controller
class UserListElement extends HTMLElement {
  @targets users: HTMLElement[]

  valid() {
    // Every user must be valid!
    return this.users.every(user => user.valid())
  }
}
```

### Target Vs Targets

To clarify the difference between `@target` and `@targets` here is a handy table:

| Decorator  | Equivalent Native Method | Selector           | Returns          | 
|:-----------|:-------------------------|:-------------------|:-----------------|
| `@target`  | `querySelector`          | `data-target="*"`  | `Element`        | 
| `@targets` | `querySelectorAll`       | `data-targets="*"` | `Array<Element>` | 

### Targets and "ShadowRoots"

Custom elements can create encapsulated DOM trees known as "Shadow" DOM. Catalyst targets support Shadow DOM by traversing the `shadowRoot` first, if present.

Important to note here is that nodes from the `shadowRoot` get returned _first_. So `@targets` will return an array of nodes, where shadowRoot nodes are at the start of the Array, and `@target` will return a ShadowRoot target if it exists, otherwise it will fall back to traversing the elements direct children.

### What about without Decorators?

If you're not using decorators, then the `@target` and `@targets` decorators have an escape hatch: you can define a static class field using the `[target.static]` computed property, as an array of key names. Like so:

```js
import {controller, target, targets} from '@github/catalyst'

controller(class HelloWorldElement extends HTMLElement {
  // The same as `@target output`
  [target.static] = ['output']

  // The same as `@targets pages; @targets links`
  [targets.static] = ['pages', 'links']

})
```

This is functionally identical to:

```js
import {controller} from '@github/catalyst'

@controller
class HelloWorldElement extends HTMLElement {
  @target output

  @targets pages
  @targets links

}
```