---
chapter: 6
subtitle: Quering Slots
hidden: true
---

Similar to [`@target`]({{ site.baseurl }}/guide/targets), Catalyst includes an `@slot` decorator which allows for querying [`<slot>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Slot) elements within a [ShadowRoot](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot). Slots are useful for having interchangeable content within a components shadow tree. You can read more about [Slots on MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Slot).

While `<slot>` elements do not require any JavaScript to work, it can be very useful to know when the contents of a `<slot>` have changed. By using the `@slot` decorator over a setter field, any time the slot or changes, including when the assigned nodes change, the setter will be called:

```html
<hello-world>
  <template shadowroot="open">
    <slot name="greeting"></slot>

    We have <span data-target="hello-world.count">0</span> greetings!
  </template>

  <p slot="greeting">Hello World!</p>
  <p slot="greeting">Hola Mundo!</p>
  <p slot="greeting">Bonjour le monde!</p>
</hello-world>
```

```typescript
import {slot, controller} from '@github/catalyst'

@controller
class HelloWorld extends HTMLElement {
  @target count: HTMLElement

  @slot set greeting(slot: HTMLSlotElement) {
    this.count.textContent = slot.assignedNodes().length
  }
}
```

### Slot naming

The `@slot` decorator works just like `@target` or `@attr`, in that the camel-cased property name is _dasherized_ when serialised to HTML. Take a look at the following examples:

```html
<slot-naming-example>
  <template shadowroot="open">
    <slot name="hello-world"></slot>
    <slot name=""></slot>
  </template>

  <p slot="greeting">Hello World!</p>
  <p slot="greeting">Hola Mundo!</p>
  <p slot="greeting">Bonjour le monde!</p>
</hello-world>
```

```typescript
import {slot, controller} from '@github/catalyst'

@controller
class HelloWorld extends HTMLElement {
  @target count: HTMLElement

  @slot set greeting(slot: HTMLSlotElement) {
    this.count.textContent = slot.assignedNodes().length
  }
}
```


### The un-named "main" slot

ShadowRoots can also have an "unnamed slots", which by default this will contain all of the elements top-level child elements that don't have a `slot` attribute. As this slot does not have a name, it cannot easily map to a property on the class. For this we have a special `mainSlot` symbol which can be used to refer to the "unnamed slot" or "main slot":

```html
<user-greeting>
  <template shadowroot="open">
    <slot></slot>!
  </template>
</user-greeting>
```

```typescript
import {slot, mainSlot, controller} from '@github/catalyst'

@controller
class HelloWorld extends HTMLElement {
  @slot [mainSlot]: HTMLSlotElement

  connectedCallback() {
    console.log(this[mainSlot].assignedNodes)
  }
}
```

### What about without Decorators?

If you're not using decorators, then `@slot` has an  escape hatch: you can define a static class field using the `[slot.static]` computed property, as an array of key names. Like so:

```js
import {controller, mainSlot, slot} from '@github/catalyst'
controller(
class HelloWorldElement extends HTMLElement {
  // Same as @slot fooBar
  [slot.static] = ['fooBar', mainSlot]
}
)
```
