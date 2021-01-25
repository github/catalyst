---
chapter: 7
subtitle: Using attributes as configuration
---

Components may sometimes manage state, or configuration. We encourage the use of DOM as state, rather than maintaining a separate state. One way to maintain state in the DOM is via [Attributes](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes).

As Catalyst elements are really just Web Components, they have the `hasAttribute`, `getAttribute`, `setAttribute`, `toggleAttribute`, and `removeAttribute` set of methods available, as well as [`dataset`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLOrForeignElement/dataset), but these can be a little tedious to use; requiring null checking code with each call.

Catalyst includes the `@attr` decorator, which provides nice syntax sugar to simplify, standardise, and encourage use of attributes. `@attr` has the following benefits over the basic `*Attribute` methods:

 - It maps whatever the property name is to `data-*`, [similar to how `dataset` does](https://developer.mozilla.org/en-US/docs/Web/API/HTMLOrForeignElement/dataset#name_conversion), but with more intuitive naming (e.g. `URL` maps to `data-url` not `data--u-r-l`).
 - An `@attr` property is limited to `string`, `boolean`, or `number`, it will never be `null` or `undefined` - instead it has an "empty" value. No more null checking!
 - The attribute name is automatically [observed, meaning `attributeChangedCallback` will fire when it changes](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#using_the_lifecycle_callbacks).
 - Assigning a value in the class description will make that value the _default_ value, so when the element is connected that value is set (unless the element has the attribute defined already).

To use the `@attr` decorator, attach it to a class field, and it will get/set the value of the matching `data-*` attribute.

### Example

```js
import { controller, attr } from "@github/catalyst"

@controller
class HelloWorldElement extends HTMLElement {
  @attr foo = 'hello'
}
```

This is the equivalent to:

```js
import { controller } from "@github/catalyst"

@controller
class HelloWorldElement extends HTMLElement {
  get foo(): string {
    return this.getAttribute('data-foo') || ''
  }

  set foo(value: string): void {
    return this.setAttribute('data-foo', value)
  }

  connectedCallback() {
    if (!this.hasAttribute('data-foo')) this.foo = 'Hello'
  }

  static observedAttributes = ['data-foo']
}
```

### Attribute Types

The _type_ of an attribute is automatically inferred based on the type it is first set to. This means once a value is set it cannot change type; if it is set a `string` it will never be anything but a `string`. An attribute can only be one of either a `string`, `number`, or `boolean`. The types have small differences in how they behave in the DOM.

Below is a handy reference for the small differences, this is all explained in more detail below that. 

| Type      | "Empty" value | When `get` is called | When `set` is called |
|:----------|:--------------|----------------------|:---------------------|
| `string`  | `''`          | `getAttribute`       | `setAttribute`       |
| `number`  | `0`           | `getAttribute`       | `setAttribute`       |
| `boolean` | `false`       | `hasAttribute`       | `toggleAttribute`    |

#### String Attributes

If an attribute is first set to a `string`, then it can only ever be a `string` during the lifetime of an element. The property will return an empty string (`''`) if the attribute doesn't exist, and trying to set it to something that isn't a string will turn it into one before assignment.

```js
import { controller, attr } from "@github/catalyst"

@controller
class HelloWorldElement extends HTMLElement {
  @attr foo = 'Hello'

  connectedCallback() {
    console.assert(this.foo === 'Hello')
    this.foo = null // TypeScript won't like this!
    console.assert(this.foo === 'null')
    delete this.dataset.foo // Removes the attribute
    console.assert(this.foo === '') // If the attribute doesn't exist, its an empty string!
  }
}
```

#### Boolean Attributes

If an attribute is first set to a boolean, then it can only ever be a boolean during the lifetime of an element. Boolean properties check for _presence_ of an attribute, sort of like how [`required`, `disabled` & `readonly` attributes work on forms](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes#boolean_attributes) The property will return `false` if the attribute doesn't exist, and `true` if it does, regardless of the value. If the property is set to `false` then `removeAttribute` is called, whereas `setAttribute(name, '')` is called when setting to a truthy value.

```js
import { controller, attr } from "@github/catalyst"

@controller
class HelloWorldElement extends HTMLElement {
  @attr foo = false

  connectedCallback() {
    console.assert(this.hasAttribute('data-foo') === false)
    this.foo = true
    console.assert(this.hasAttribute('data-foo') === true)
    this.setAttribute('data-foo', 'this value doesnt matter!')
    console.assert(this.foo === true)
  }
}
```

#### Number Attributes

If an attribute is first set to a number, then it can only ever be a number during the lifetime of an element. This is sort of like the [`maxlength` attribute on inputs](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/maxlength). The property will return `0` if the attribute doesn't exist, and will be coerced to `Number` if it does - this means it is _possible_ to get back `NaN`. Negative numbers and floats are also valid.

```js
import { controller, attr } from "@github/catalyst"

@controller
class HelloWorldElement extends HTMLElement {
  @attr foo = 1

  connectedCallback() {
    console.assert(this.getAttribute('data-foo') === '1')
    this.setAttribute('data-foo', 'not a number')
    console.assert(Number.isNaN(this.foo))
    this.foo = -3.14
    console.assert(this.getAttribute('data-foo') === '-3.14')
  }
}
```

### Default Values

When an element gets connected to the DOM, the attr is initialized. During this phase Catalyst will determine if the default value should be applied. The default value is defined in the class property. The basic rules are as such:

 - If the class property has a value, that is the _default_
 - When connected, if the element _does not_ have a matching attribute, the default _is_ applied.
 - When connected, if the element _does_ have a matching attribute, the default _is not_ applied, the property will be assigned to the value of the attribute instead.

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

Remember! The values defined in the class field are the _default_. They won't be set if the element is created and its attribute set to a custom value!

  </div>
</div>

The following example illustrates this behavior:

```js
import { controller, attr } from "@github/catalyst"
@controller
class HelloWorldElement extends HTMLElement {
  @attr name = 'World'
  connectedCallback() {
    this.textContent = `Hello ${name}`
  }
}
```

```html
<hello-world></hello-world>
// This will render `Hello World`

<hello-world data-name="Catalyst"></hello-world>
// This will render `Hello Catalyst`

<hello-world data-name=""></hello-world>
// This will render `Hello `
```

### What about without Decorators?

If you're not using decorators, then you won't be able to use the `@attr` decorator, but there is still a way to achieve the same result. Under the hood `@attr` simply tags a field, but `initializeAttrs` does all of the logic.

Calling `initializeAttrs` in your connected callback, with the list of properties you'd like to initialize can achieve the same result. The class fields can still be defined in your class, and they'll be overridden as described above. For example:

```js
import {initializeAttrs} from '@github/catalyst'

class HelloWorldElement extends HTMLElement {
  foo = 1

  connectedCallback() {
    initializeAttrs(this, ['foo'])
  }

}
```

This example is functionally identical to:

```js
import {controller, attr} from '@github/catalyst'

@controller
class HelloWorldElement extends HTMLElement {
  @attr foo = 1
}
```
