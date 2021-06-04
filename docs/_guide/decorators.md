---
chapter: 4
subtitle: Using TypeScript for ergonomics
---

Decorators are used heavily in Catalyst, because they provide really clean ergonomics and makes using the library a lot easier. Decorators are a special, (currently) non standard, feature of TypeScript. You'll need to turn the `experimentalDecorators` option on inside of your TypeScript project to use them (if you're using `@babel/plugin-proposal-decorators` plugin, you need to use [`legacy` option](https://babeljs.io/docs/en/babel-plugin-proposal-decorators#legacy)).

You can read more about [decorators in the TypeScript handbook](https://www.typescriptlang.org/docs/handbook/decorators.html), but here's quick guide:

Decorators can be used three ways:

### Class Decorators

Catalyst comes with the `@controller` decorator. This gets put on top of the class, like so:

```js
@controller
class HelloWorldElement extends HTMLElement {}
```

### Class Field Decorators

Catalyst comes with the `@target` and `@targets` decorators (for more on these [read the Targets guide section]({{ site.baseurl }}/guide/targets)). These get added on top or to the left of the field name, like so:

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

#### Supporting `strictPropertyInitialization`

TypeScript comes with various "strict" mode settings, one of which is `strictPropertyInitialization` which TypeScript catch potential class properties which might not be assigned during construction of a class. This option conflicts with Catalyst's `@target`/`@targets` decorators, which safely do the assignment but TypeScript's simple heuristics cannot detect this. There are two ways to work around this:

1. Use TypeScript's [`declare` modifier](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#the-usedefineforclassfields-flag-and-the-declare-property-modifier) to tell TypeScript that the decorated field will still be set up correctly:

    ```typescript
    class HelloWorldElement extends HTMLElement {
      @target declare something: HTMLElement
      @targets declare items: HTMLElement[]
    }
    ```
    
    Note that this only works on TypeScript 3.7+, so if you're on an older version, you can also use the [definite initialization operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#definite-assignment-assertions) to do the same thing.

2. You can also disable the compiler option (other strict mode rules can still apply) in your `tsconfig.json` like so:

    ```json
    {
      "compilerOptions": {
        "strict": true,
        "strictPropertyInitialization": false
      }
    }
    ```

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
