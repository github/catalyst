---
chapter: 16 
subtitle: Create your own abilities
---

Catalyst provides the functionality to create your own abilities, with a few helper methods and a `controllable` base-level ability. These are explained in detail below, but for a quick summary they are:

 - `createAbility` - a helper function to make new abilities (class decorators).
 - `createMark` - a helper function to generate class field & method decorators.
 - `tag-observer` - a set of helper functions to watch for tagged children in an element's subtree.
 - `controllable` - the base ability which allows interacting with semi-private parts of an element.

## createAbility

This function allows you to make your own [Ability]({{ site.baseurl }}/guide/abilities). Abilities are really Class Decorators, but there's a couple of things that `createAbility` provides to simplify the ergonomics of Class Decorators:

 - TypeScript can be a little tricky when working with Class Decorators. `createAbility` simplifies this a bit.
 - JavaScript does not copy over the `name` property when extending a class (e.g. via a decorator), and it can be a little cumbersome to do this, so `createAbility` does this for you.
 - Abilities are [idempotent](https://en.wikipedia.org/wiki/Idempotence). Class decorators are not idempotent by default, which means applying a decorator multiple times can cause issues. `createAbility` mitigates this by memoizing the classes it has applied to, meaning applying an ability multiple times has no effect past the first application.

The above three features of `createAbility` make it really useful when creating mixins for web components, and makes them much easier for developers as they can trust an ability to not be sensitive to these problems.

To create an ability, call the `createAbility` method and pass in a callback function which takes a `CustomElementClass` and returns a new class. You can also provide extra types if your returned class adds new methods or fields. Here's an example, using TypeScript:


```typescript
import type {CustomElementClass} from '@github/catalyst'
import {createAbility} from '@github/catalyst'

// by convention, abilities end in "able"
interface Fooable {
  foo(): void // This interface has additional methods on top of `CustomElementClass`!
}

// Fooable: automatically calls `foo()` on `connectedCallback`
export const fooable = createAbility(
  //                                          ↓ Notice the `& { new (): Fooable }`
  <T extends CustomElementClass>(Class: T): T & { new (): Fooable } =>
    class extends Class {
      connectedCallback() {
        this.foo()
      }

      foo() {
        console.log('Foo was called!')
      }
    }
)
```

Inside the `class extends Class` block, you can author custom element logic that you might want to make reusable across a multitude of elements. You can also adjust the input type to subclass `CustomElementClass`, which can be useful for setting up a contract between your Ability and the classes that rely on it:

```typescript
import type {CustomElementClass} from '@github/catalyst'
import {createAbility} from '@github/catalyst'

// by convention, abilities end in "able"
interface Fooable {
  foo(): void // This interface has additional methods on top of `CustomElementClass`!
}

interface FooableClass {
  new(...args: any[]): Fooable
}

// Fooable: automatically calls `foo()` on `connectedCallback`
export const fooable = createAbility(
  //                            ↓ Notice the `& FooableClass`
  <T extends CustomElementClass & FooableClass>(Class: T): T =>
    class extends Class {
      // TypeScript will expect the constructor to be defined for a mixin
      constructor(...args: any[]) {
        super(...args)
      }

      connectedCallback() {
        // Classes that apply this ability _must_ implement `foo()`.
        super.foo()
      }
    }
```

If you're interested in some advanced examples, you can take a look at the Catalyst source code - every feature of Catalyst is an Ability!

## createMark

This function allows you to make annotations for fields (like `@attr` and `@target`). Marks are really Field/Method Decorators, but with simpler ergonomics:

 - Marks are only initialized on instances, which makes them easier to reason about.
 - Marks are not configurable, which keeps them simple.
 - They are built to ease a transition between TypeScript decorators and ECMAScript decorators, which will help as decorators become standardised.

`createMark` can be called with a `validate` and an `init` function, and gives back a tuple of 3 functions: the decorator itself, a function to get a list of marks that an instance has, and a function that will initialise the marks on an instance. It can be used like so:

```typescript

// Makes the @prop decorator
const [prop, getProps, initProps] = createMark(
  ({name, kind}) => {
    // Validate the name and kind that a mark can have.
    // Name will be the PropertyKey that was decorated, and `kind` will be one of:
    // "method", "field", "getter", "setter".
    if (kind === "method") {
      throw new Error(`@prop cannot be used to mark a method`)
    }
  },
  (instance: CustomElement, {name, kind, access}) => {
    // Put field initialization logic here.
    // Return a property descriptor to define a field's functionality:
    let value = kind === 'field' ? access.value : access.get?.call(instance)
    return {
      get() { return value }
      set(newValue) {
        value = newValue
        instance.propChanged(name, newValue)
      }
    }
  }
)
```

If you want to find some examples of how marks work, take a look at the Catalyst source code! All field decorators (`@attr`, `@target`, `@provide`, `@consume` and so on) use `createMark`.

## tag-observer

Tag Observer provides a set of functions to observe elements marked with well-known attributes across the DOM, allowing classes to be reactive to DOM mutations. These functions operate over a `MutationObserver` set up to detect new elements coming into the page that have a registered attribute. To call register a new tag you can use the `registerTag` function which takes an attribute name to observe, a parse function (that parses the attribute value), and a found function (which is called for each element that has the attribute):

```typescript
registerTag(
  `data-foo`,
  (value: string) => value.split('.'),
  (el: Element, controller: Element | ShadowRoot, ...meta: string[]) => {
    // ...
  }
)
```

Tag Observer also provides a `observeElementForTags` function, which can be called on an element to adopt it into observation. A good place to use this is in your Abilities `connectedCallback`. This function can also take a `shadowRoot` if you're interested in observing tags within the shadow DOM (recommended). This function will find the root element (`ownerDocument`) and begin observing it.

```typescript
export const fooable = createAbility(
  <T extends CustomElementClass>(Class: T): T =>
    class extends Class {
      connectedCallback() {
        observeElementForTags(this) // This elements ownerDocument will now look out for new tags
      }
    }
```

Whenever an element appears on the page with the matching attribute (e.g. `data-foo`), the value is extracted, split by whitespace, and each substring is then given to `parse` to turn into an array of strings. The first value in the array that the parse function returns must be a parent selector, which is then used to find the controller this attribute could pertain to. If the element is a child of the given controller selector, then the found function is called with the element, the controller, and any additional metadata that the parse function extracted. Let's see an example for how this might work, given the above registered tag:

```html
<my-element>
  <div data-foo="my-element.foo.bar other-element.baz.bing"></div>
</my-element>
```

- Our `data-foo` attribute is found in the DOM, belonging to the `div` element.
- The value is extracted and split by whitespace.
- Our parse function gets called twice, firstly with `my-element.foo.bar`
  - The parse function splits this by `.` which gets us `['my-element', 'foo', 'bar']`.
  - Tag observer uses `my-element` as the parent selector and calls `div.closest('my-element')`,
  - The `<my-element>` controller is found.
  - Our found function is called with `(<div data-foo="..."/>, <my-element/>, ['foo', 'bar'])`
- The parse function is also called with `other-element.baz.bing`.
  - The parse function splits this by `.` which gets us `['other-element', 'baz', 'bing']`.
  - Tag observer uses `other-element` as the parent selector and calls `div.closest('other-element')`,
  - No parent element is found, so the found function is not called.

To take a look at how Tag Observer is used in Catalyst, you can look at [`data-action` (the Actionable ability)]({{ site.baseurl }}/guide/actions) or [`data-target` & `data-targets` (the Targetable ability)]({{ site.baseurl }}/guide/targets).

## controllable

`controllable` is a basic ability which other abilities can use to simplify connecting to a custom elements private state. This ability isn't _required_ to be used when creating your own abilities, but it's very useful for abilities which expect to use either the [ShadowDOM](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot) or [ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals).

You can create an ability that itself uses the `controllable` ability like so:

```typescript
import type {CustomElementClass} from '@github/catalyst'
import {createAbility, controllable} from '@github/catalyst'

createAbility((Class: CustomElementClass) => class extends controllable(Class) {
  // Your behaviour goes here!
}
```

The `controllable` ability provides 2 _custom_ callbacks which allow you to safely & robustly intercept the attachment of a ShadowRoot, and the attachment of ElementInternals. Let's look at each:

### `[attachShadowCallback](shadowRoot: ShadowRoot)`

```typescript
import type {CustomElementClass} from '@github/catalyst'
import {createAbility, attachShadowCallback, controllable} from '@github/catalyst'

createAbility((Class: CustomElementClass) => class extends controllable(Class) {
  [attachShadowCallback](shadowRoot: ShadowRoot) {
    super[attachShadowCallback](shadowRoot)
    // Do stuff with the `shadowRoot`.
  }
}
```

`attachShadowCallback` is a special `Symbol()` which allows you to make a method mostly hidden from other classes. `controllable` will call this symbol method whenever a ShadowRoot is attached to the element, which can be attached in 2 different ways:

 - During the constructor, where the element might recieve a declarative ShadowDOM root (closed or open).
 - Any time the `attachShadow()` function is called.

This method is _usually_ called zero or once, but may be called twice if the element recieves a Declarative ShadowDOM root, and overrides this with another call to `attachShadow()`.

Simply overriding `this.attachShadow` or trying to access `this.shadowRoot` can be a little tricky (if an element has a closed declarative shadow root this can be especially difficult to access within mixins), so this callback can be especially useful for working around the various ways a shadowRoot can be created.

### `[attachInternalsCallback](internals: ElementInternals)`

```typescript
import type {CustomElementClass} from '@github/catalyst'
import {createAbility, attachInternalsCallback, controllable} from '@github/catalyst'

createAbility((Class: CustomElementClass) => class extends controllable(Class) {
  [attachInternalsCallback](internals: ElementInternals) {
    super[attachInternalsCallback](internals)
    // Do stuff with the `internals`.
  }
}
```

`attachInternalsCallback` is a special `Symbol()` which allows you to make a method mostly hidden from other classes. `controllable` will call this symbol method whenever an element is constructed, giving it the element's `ElementInternals`. This enables custom enablies [Abilities]({{ site.baseurl }}/guide/abilities) to also have access to `ElementInternals`. It does so while also preserving the ability for `attachInternals()` to be called again (usually `attachInternals()` will error if called twice).

If you need access to the internals, then the `attachInternalsCallback` can be very useful as it protects you from calling `attachInternals` in a way which the concrete classes will then fail.
