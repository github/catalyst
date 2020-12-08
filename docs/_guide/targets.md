---
chapter: 5
subtitle: Querying Descendants
---

One of the three [core patterns]({{ site.baseurl }}/guide/introduction#three-core-concepts-observe-listen-query) is Querying. In Catalyst, Targets are the preferred way to query. Targets use `querySelector` under the hood, but in a way that makes it a lot simpler to work with.

Catalyst Components are really just Web Components, so you could simply use `querySelector` or `querySelectorAll` to select descendants of the element. Targets avoid some of the problems of `querySelector`; they provide a more consistent interface, avoid coupling CSS classes or HTML tag names to JS, and they handle subtle issues like nested components. Targets are also a little more ergonomic to reuse in a class. We'd recommend using Targets over `querySelector` wherever you can.

To create a Target, use the `@target` decorator on a class field, and add the matching `data-target` attribute to your HTML, like so:

### Example

<div class="d-flex my-4">
  <div>

```html
<hello-world>
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

Remember! There are two decorators available, `@target` which fetches only one `data-target` element, and `@targets` which fetches multiple `data-targets` elements!

  </div>
</div>

The `@target` decorator will only ever return _one_ element, just like `querySelector`. If you want to get multiple Targets, you need the `@targets` decorator which works almost the same, but returns an Array of elements, and it searches the `data-targets` attribute (not `data-target`). 

Elements can be referenced as multiple targets, and targets may be referenced multiple times within the HTML:

```html
<team-members>
  <user-list>
    <user-settings data-targets="user-list.users">
      <input type="checkbox" data-targets="team-members.reads user-settings.reads">
      <input type="checkbox" data-targets="team-members.writes user-settings.writes">
    </user-settings>
    <user-settings data-targets="user-list.users">
      <input type="checkbox" data-targets="team-members.reads user-settings.reads">
      <input type="checkbox" data-targets="team-members.writes user-settings.writes">
    </user-settings>
  </user-list>
</team-members>
```

<br>

```js
import { controller, target, targets } from "@github/catalyst"

@controller
class UserSettingsElement extends HTMLElement {
  @target read: HTMLInputElement
  @target write: HTMLInputElement

  valid() {
    // One checkbox must be checked!
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

If you're using decorators, then the `@target` and `@targets` decorators will turn the decorated properties into getters.

If you're not using decorators, then you'll need to make a `getter`, and call `findTarget(this, key)` or `findTargets(this, key)` in the getter, for example:

```js
import {findTarget, findTargets} from '@github/catalyst'
class HelloWorldElement extends HTMLElement {

  get outputTarget() {
    return findTarget(this, 'outputTarget')
  }

  get pages() {
    return findTargets(this, 'pages')
  }

}
```
