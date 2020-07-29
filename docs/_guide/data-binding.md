---
chapter: 7
subtitle: Data Binding
---

Catalyst Components can maintain their own internal state as [class fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields), these are convenient because they're easy to access, but it can be hard to figure out when to update a components UI when these fields change, as there's no way of knowing when a field gets set.

You could resort to using `get`&`set` methods, but this can quickly become unwieldy:

```typescript
class MyClass {
  prop = 1 // Cannot observe changes to this field
}
// vs
class MyClass {
  #prop = 1 // make a private field just to hold the state somewhere
  get prop() {
    return this.#prop
  }
  set prop() {
    this.#prop = prop
    this.update()
  }
}
```

With the `@prop` decorator, its possible to declare class fields, and get notified when they change - by `propertyChangedCallback` being fired each time a property is set.

### Example

<div class="d-flex my-4">
  <div class="">

```html
<hello-world>
  <input
    data-action="input:hello-world.setName"
    type="text"
  >
  <span
    data-target="hello-world.output">
  </span>
</hello-world>
```

  </div>
  <div class="ml-4">

```typescript
import { controller, target, prop }
  from "@github/catalyst"

@controller
class HelloWorldElement extends HTMLElement {
  @target output: HTMLElement

  @prop name: string = ''

  setName(event: Event) {
    this.name = event.currentTarget.value
  }

  propertyChangedCallback(key, oldValue, newValue) {
    console.log(`this.${key} changed 
    from ${oldValue} to ${newValue}`)
    if (key === 'name') {
      if (oldValue !== newValue) {
        this.output.textContent = this.name
      }
    }
  }
}
```

  </div>
</div>

### The `@prop` decorator

Any [class field](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields) with the `@prop` decorator will call `propertyChangedCallback` as soon as its value set via an [_assignment operator_ ](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators#Assignment_operators) (such as the assignment operator `=`, math assignment operators such as `*=`, `/=`, `%=`, `+=`, and `-=`, logical assignment such as `&&=`, `||=`, `??=`, and so on).

This is an important distinction to make, because if you _mutate_ data structures such as Objects or Arrays, then `propertyChangedCallback` will _not_ be called. Mutating an Object includes setting a property, for example `foo.bar = 1`, while mutating arrays includes calling `push()` or `splice()`. These are very difficult to observe for, and so Catalyst will not make an attempt to observe such nested mutations.

<div class="d-flex border rounded-1 my-3 box-shadow-medium">
  <span class="d-flex bg-yellow text-white rounded-left-1 p-3">
  <svg xmlns="http://www.w3.org/2000/svg" class="octicon octicon-warn" viewBox="0 0 24 24" width="24" height="24"><path d="M13 17.5a1 1 0 11-2 0 1 1 0 012 0zm-.25-8.25a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5z"></path><path fill-rule="evenodd" d="M9.836 3.244c.963-1.665 3.365-1.665 4.328 0l8.967 15.504c.963 1.667-.24 3.752-2.165 3.752H3.034c-1.926 0-3.128-2.085-2.165-3.752L9.836 3.244zm3.03.751a1 1 0 00-1.732 0L2.168 19.499A1 1 0 003.034 21h17.932a1 1 0 00.866-1.5L12.866 3.994z"></path></svg>
  </span>
  <div class="p-3">

Be careful! Catalyst cannot observe _nested changes_ to the properties, for example calling `push()` on an Array or setting nested properties in an object. These _won't_ call `propertyChangedCallback`!

  </div>
</div>

### Using Prop with computed properties, via getters/setters

Sometimes you _want_ to derive a property based on other state or algorithms, which is possible using the `get`/`set` methods. It's still useful to keep this simple, and use the `@prop` decorator to maintain observability to invoke side effect. These `get`/`set` fields will also work with the `@prop` decorator. Below is an example that delegates the `opened` property to be the opposite of what `hidden` is. When `opened` is changed, it will fire the `propertyChangedCallback` with the expected values.

```typescript
import { controller, target, prop } from "@github/catalyst"

@controller
class HelloWorldElement extends HTMLElement {
  @prop
  get opened() {
    return !this.hidden
  }
  set opened(open) {
    this.hidden = !open
  }

  connectedCallback() {
    this.opened = true
  }

  propertyChangedCallback(key, oldValue, newValue) {
    if (key === 'opened') {
      if (newValue === true) {
        this.dispatchEvent(new Event('opened'))
      } else {
        this.dispatchEvent(new Event('closed'))
      }
    }
  }
}
```

### The `propertyChangedCallback` method

`propertyChangedCallback` is a _lifecycle method_, it is well known to Catalyst and is called automatically whenever a `@prop` decorated property is assigned. The `propertyChangedCallback` method is given three arguments, it should have a signature like this:

```typescript
propertyChangedCallback(name: string|Symbol, oldValue: unknown, newValue: unknown): void {}
```

The `oldValue` will be the value that this property used to have, prior to the most recent assignment, while the `newValue` will be the _already assigned value_. It is worth noting that there is no way to prevent the new assignment of this property, as `propertyChangedCallback` is called _after_ the property has been assigned.


### What about without Decorators?

If you're using decorators, then the `@prop` decorator will handle calling `propertyChangedCallback` for you. However if you're not using decorators, you can manually tell Catalyst to observe properties, by making a `static observedProperties` Array field on your controller:

```typescript
import {controller} from '@github/catalyst'
controller(class HelloWorldElement extends HTMLElement {
  static observedProperties = ['name'] // @prop does this for you.

  name = ''
})
```

Importantly, you'll still need to call `controller()` on the class, as this reads the `observedProperties` array and sets up the data binding.

If you want _just_ the observe behavior, without the additional behaviours that `controller` gives you, you can import the `observeProperties` function, which will also work on any generic class, and does not to extend from `HTMLElement`:

```typescript
import {observeProperties} from '@github/catalyst'
observeProperties(class AnyClass {
  static observeProperties = ['name']

  name = ''
})
```
