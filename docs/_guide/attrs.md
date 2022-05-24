---
chapter: 7
subtitle: Using attributes as configuration
---

Components may sometimes manage state, or configuration. We encourage the use of DOM as state, rather than maintaining a separate state. One way to maintain state in the DOM is via [Attributes](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes).

As Catalyst elements are really just Web Components, they have the `hasAttribute`, `getAttribute`, `setAttribute`, `toggleAttribute`, and `removeAttribute` set of methods available, as well as [`dataset`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLOrForeignElement/dataset), but these can be a little tedious to use; requiring null checking code with each call.

Catalyst includes the `@attr` decorator which provides nice syntax sugar to simplify, standardise, and encourage use of attributes. `@attr` has the following benefits over the basic `*Attribute` methods:

 - It dasherizes a property name, making it safe for HTML serialization without conflicting with [built-in global attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes). This works the same as the class name, so for example `@attr pathName` will be `path-name` in HTML, `@attr srcURL` will be `src-url` in HTML.
 - An `@attr` property automatically casts based on the initial value - if the initial value is a `string`, `boolean`, or `number` - it will never be `null` or `undefined`. No more null checking!
 - It is automatically synced with the HTML attribute. This means setting the class property will update the HTML attribute, and setting the HTML attribute will update the class property!
 - Assigning a value in the class description will make that value the _default_ value so if the HTML attribute isn't set, or is set but later removed the _default_ value will apply.

This behaves similarly to existing HTML elements where the class field is synced with the html attribute, for example the `<input>` element's `type` field:

```ts
const input = document.createElement('input')
console.assert(input.type === 'text') // default value
console.assert(input.hasAttribute('type') === false) // no attribute to override
input.setAttribute('type', 'number')
console.assert(input.type === 'number') // overrides based on attribute
input.removeAttribute('type')
console.assert(input.type === 'text') // back to default value
```

{% capture callout %} 
An important part of `@attr`s is that they _must_ comprise of two words, so that they get a dash when serialised to HTML. This is intentional, to avoid conflicting with [built-in global attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes).  To see how JavaScript property names convert to HTML dasherized names, try typing the name of an `@attr` below:
{% endcapture %}{% include callout.md %}

<form>
  <label>
    <h4>I want my `@attr` to be named...</h4>
    <input class="js-attr-dasherize-test mb-4">
  </label>
  <div hidden class="js-attr-dasherize-bad text-red">
    {{ octx }} An attr name must be two words, so that the HTML version includes a dash!
  </div>
  <div hidden class="js-attr-dasherize-good text-green">
    {{ octick }} This will be <code></code> in HTML.
  </div>
  <script type="module">
    import {mustDasherize} from 'https://unpkg.com/@github/catalyst/lib/index.js'
    document.querySelector('.js-attr-dasherize-test').addEventListener('input', () => {
      let name = event.target.value
      const goodEl = document.querySelector('.js-attr-dasherize-good')
      const badEl = document.querySelector('.js-attr-dasherize-bad')
      if (name === '') {
        goodEl.hidden = true
        badEl.hidden = true
        return
      }
      let pass = true
      try {
        name = mustDasherize(name)
      } catch (e) {
        pass = false
      }
      goodEl.querySelector('code').textContent = name
      goodEl.hidden = !pass
      badEl.hidden = pass
    })
  </script>
</form>

To use the `@attr` decorator, attach it to a class field, and it will get/set the value of the matching dasherized HTML attribute.

### Example

<!-- annotations
attr fooBar: Maps to get/setAttribute('foo-bar')
-->

```js
import { controller, attr } from "@github/catalyst"

@controller
class HelloWorldElement extends HTMLElement {
  @attr fooBar = 'hello'
}
```

This is somewhat equivalent to:

```js
import { controller } from "@github/catalyst"

@controller
class HelloWorldElement extends HTMLElement {
  get fooBar(): string {
    return this.getAttribute('foo-bar') || ''
  }

  set fooBar(value: string): void {
    return this.setAttribute('foo-bar', value)
  }

  connectedCallback() {
    if (!this.hasAttribute('foo-bar')) this.fooBar = 'Hello'
  }

}
```

### Attribute Types

The _type_ of an attribute is automatically inferred based on the type it is first set to. This means once a value is initially set it cannot change type; if it is set a `string` it will never be anything but a `string`. An attribute can only be one of either a `string`, `number`, or `boolean`. The types have small differences in how they behave in the DOM.

Below is a handy reference for the small differences, this is all explained in more detail below that. 

| Type      | When `get` is called | When `set` is called |
|:----------|----------------------|:---------------------|
| `string`  | `getAttribute`       | `setAttribute`       |
| `number`  | `getAttribute`       | `setAttribute`       |
| `boolean` | `hasAttribute`       | `toggleAttribute`    |

#### String Attributes

If an attribute is first set to a `string`, then it can only ever be a `string` during the lifetime of an element. The property will revert to the initial value if the attribute doesn't exist, and trying to set it to something that isn't a string will turn it into one before assignment.

<!-- annotations
attr foo: Maps to get/setAttribute('foo-bar')
-->

```js
import { controller, attr } from "@github/catalyst"

@controller
class HelloWorldElement extends HTMLElement {
  @attr fooBar = 'Hello'

  connectedCallback() {
    console.assert(this.fooBar === 'Hello')
    this.fooBar = 'Goodbye'
    console.assert(this.fooBar === 'Goodbye'')
    console.assert(this.getAttribute('foo-bar') === 'Goodbye')

    this.removeAttribute('foo-bar')
    // If the attribute doesn't exist, it'll output the initial value!
    console.assert(this.fooBar === 'Hello') 
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
  @attr fooBar = false

  connectedCallback() {
    console.assert(this.hasAttribute('foo-bar') === false)
    this.fooBar = true
    console.assert(this.hasAttribute('foo-bar') === true)
    this.setAttribute('foo-bar', 'this value doesnt matter!')
    console.assert(this.fooBar === true)
  }
}
```

#### Number Attributes

If an attribute is first set to a number, then it can only ever be a number during the lifetime of an element. This is sort of like the [`maxlength` attribute on inputs](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/maxlength). The property will return the initial value if the attribute doesn't exist, and will be coerced to `Number` if it does - this means it is _possible_ to get back `NaN`. Negative numbers and floats are also valid.

<!-- annotations
attr foo: Maps to get/setAttribute('foo-bar')
-->

```js
import { controller, attr } from "@github/catalyst"

@controller
class HelloWorldElement extends HTMLElement {
  @attr fooBar = 1

  connectedCallback() {
    this.fooBar = 2
    console.assert(this.getAttribute('foo-bar') === '2')
    this.setAttribute('foo-bar', 'not a number')
    console.assert(Number.isNaN(this.fooBar))
    this.fooBar = -3.14
    console.assert(this.getAttribute('foo-bar') === '-3.14')
  }
}
```

### Default Values

When an element gets connected to the DOM, the attr is initialized. During this phase Catalyst will determine if the default value should be applied. The default value is defined in the class property. The basic rules are as such:

 - If the class property has a value, that is the _default_
 - When connected, if the element _does not_ have a matching attribute, the _default is_ applied.
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
  @attr dataName = 'World'
  connectedCallback() {
    this.textContent = `Hello ${this.dataName}`
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

### Advanced usage

#### Determining when an @attr changes value

To be notified when an `@attr` changes value, you can use the decorator over
"setter" method instead, and the method will be called with the new value
whenever it is re-assigned, either through HTML or JavaScript:

```typescript
import { controller, attr } from "@github/catalyst"
@controller
class HelloWorldElement extends HTMLElement {

  @attr get dataName() {
    return 'World' // Used to get the intial value
  }
  // Called whenever `name` changes
  @attr set dataName(newValue: string) {
    this.textContent = `Hello ${newValue}`
  }
}
```

### What about without Decorators?

If you're not using decorators, then the `@attr` decorator has an escape hatch: You can define a static class field using the `[attr.static]` computed property, as an array of key names. Like so:

```js
import {controller, attr} from '@github/catalyst'

controller(
class HelloWorldElement extends HTMLElement {
  // Same as @attr fooBar
  [attr.static] = ['fooBar']

  // Field can still be defined
  fooBar = 1
}
)
```

This example is functionally identical to:

```js
import {controller, attr} from '@github/catalyst'

@controller
class HelloWorldElement extends HTMLElement {
  @attr fooBar = 1
}
```
