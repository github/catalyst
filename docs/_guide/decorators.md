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
class MyController extends HTMLElement {}
```

### Class Field Decorators

Catalyst comes with the `@target` and `@targets` decorators for more [read about Targets](/guide/targets). These get added on top or to the left of the field name, like so:

```js
class MyController extends HTMLElement {

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
class MyController extends HTMLElement {

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

### Function Call Decorators

Some decorators are customisable - they get called with additional arguments, just like a function call. An example of this is the `@debounce` decorator in the [`@github/mini-throttle`](https://github.com/github/mini-throttle) package:

```js
class MyController extends HTMLElement {

  @debounce(100)
  handleInput() {
    // ...
  }

}
```
<br>
