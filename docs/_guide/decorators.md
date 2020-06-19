---
chapter: 3
subtitle: Using TypeScript for ergonomics
---

Decorators are used heavily in Catalyst, because they provide really clean ergonomics and makes using the library a lot easier. Decorators are a special, (currently) non standard, feature of TypeScript. You'll need to turn the `experimentalDecorators` option on inside of your TypeScript project to use them.

You can read more about [decorators in the TypeScript handbook](https://www.typescriptlang.org/docs/handbook/decorators.html), but here's quick guide:

Decorators can be used three ways:

### Class Decorators

Catalyst comes with the `@controller` decorator. This gets put on top of the class, like so:

```js
@controller
class HelloWorldElement extends HTMLElement {}
```

### Class Field Decorators

Catalyst comes with the `@target` and `@targets` decorators (for more on these [read the Targets guide section](/guide/targets)). These get added on top or to the left of the field name, like so:

```js
class HelloWorldElement extends HTMLElement {

  @target something
  
  // Alternative style
  @targets
  others

}
```
<br>

Class Field decorators get given the class and the field name so they can add custom functionality to the field. Because they operate on the fields, they must be put on top of or to the left of the field.

### Method Decorators

Catalyst doesn't currently ship with any method decorators, but you might see them in code. They work just like Field Decorators (in fact they're the same thing). Put them on top or on the left of the method, like so:


```js
class HelloWorldElement extends HTMLElement {

  @log
  submit() {
    // ...
  }

  // Alternative style

  @log load() {
    // ...
  }

}
```

### Function Calling Decorators

You might see some decorators that look like function calls, and that's because they are! Some decorators allow for customisation; calling with additional arguments. Decorators that expect to be called are generally not interchangeable with the non-call variant, a decorators documentation should tell you how to use it.

Catalyst doesn't ship with any decorators that can be called like a function; but an example of one can be found in the `@debounce` decorator in the [`@github/mini-throttle`](https://github.com/github/mini-throttle) package:

```js
class HelloWorldElement extends HTMLElement {

  @debounce(100)
  handleInput() {
    // ...
  }

}
```
<br>
