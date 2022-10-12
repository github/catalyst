---
version: 1
chapter: 6
title: Attrs
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

<!-- annotations
attr foo: Maps to get/setAttribute('datafoo')
-->

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

<!-- annotations
attr foo: Maps to get/setAttribute('data-foo')
-->

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

<!-- annotations
attr foo: Maps to has/toggleAttribute('data-foo')
-->

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

<!-- annotations
attr foo: Maps to get/setAttribute('data-foo')
-->

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

{% capture callout %}
Remember! The values defined in the class field are the _default_. They won't be set if the element is created and its attribute set to a custom value!
{% endcapture %}{% include callout.md %}

The following example illustrates this behavior:

<!-- annotations
attr name: Maps to get/setAttribute('data-name')
-->

```js
import { controller, attr } from "@github/catalyst"
@controller
class HelloWorldElement extends HTMLElement {
  @attr name = 'World'
  connectedCallback() {
    this.textContent = `Hello ${this.name}`
  }
}
```

<!-- annotations
data-name ".*": Will set the value of `name`
-->

```html
<hello-world></hello-world>
// This will render `Hello World`

<hello-world data-name="Catalyst"></hello-world>
// This will render `Hello Catalyst`

<hello-world data-name=""></hello-world>
// This will render `Hello `
```

### What about without Decorators?

If you're not using decorators, then you won't be able to use the `@attr` decorator, but there is still a way to achieve the same result. Under the hood `@attr` simply tags a field, but `initializeAttrs` and `defineObservedAttributes` do all of the logic.

Calling `initializeAttrs` in your connected callback, with the list of properties you'd like to initialize, and calling `defineObservedAttributes` with the class, can achieve the same result as `@attr`. The class fields can still be defined in your class, and they'll be overridden as described above. For example:

```js
import {initializeAttrs, defineObservedAttributes} from '@github/catalyst'

class HelloWorldElement extends HTMLElement {
  foo = 1

  connectedCallback() {
    initializeAttrs(this, ['foo'])
  }

}
defineObservedAttributes(HelloWorldElement, ['foo'])
```

This example is functionally identical to:

```js
import {controller, attr} from '@github/catalyst'

@controller
class HelloWorldElement extends HTMLElement {
  @attr foo = 1
}
```
