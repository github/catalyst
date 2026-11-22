---
version: 1
chapter: 3
title: Decorators
subtitle: Using TypeScript for ergonomics
---

Decorators are used heavily in Catalyst, because they provide really clean ergonomics and makes using the library a lot easier. Catalyst's decorators work with both TypeScript's legacy `experimentalDecorators` option (or the `@babel/plugin-proposal-decorators` [`legacy` option](https://babeljs.io/docs/en/babel-plugin-proposal-decorators#legacy)) and [standard decorators](#standard-decorators). The same imports work in both modes.

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

### Method Decorators

Method decorators work just like Field Decorators. Put them on top or on the left of the method, like so:


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

### Getter/Setter 

Decorators can also be used over a `get` or `set` field. These work just like Field Decorators, but you can put them over one or both the `get` or `set` field. Some decorators might throw an error if you put them over a `get` field, when they expect to be put over a `set` field:


```js
class HelloWorldElement extends HTMLElement {

  @target set something() {
    // ...
  }

  // Can be used over just one field
  @attr get data() {
    return {}
  }
  set data() {

  }
}
```

### Standard decorators

TypeScript 5.0+ and SWC (`decoratorVersion: "2023-11"`) compile standard (TC39) decorators when `experimentalDecorators` is off. `@controller`, `@attr`, `@target` and `@targets` support them, with two differences from legacy decorators:

- `@target` and `@targets` must decorate an `accessor`. Standard decorators can't decorate `declare` fields, and a plain field would hide the getter the decorator defines:

    ```typescript
    @controller
    class HelloWorldElement extends HTMLElement {
      @target accessor output!: HTMLElement
      @targets accessor items!: HTMLElement[]
    }
    ```

    Assigning to the accessor throws a `TypeError`, just as assigning to the getter-only legacy property does.
- `@attr` records its fields in [decorator metadata](https://github.com/tc39/proposal-decorator-metadata), so with TypeScript you need version 5.2 or later. `@attr` can decorate a field, an `accessor`, a getter or a setter. Prefer a field, such as `@attr name!: string` in place of a legacy `@attr declare name: string`: standard decorators register accessors before fields, so mixing them changes the order attrs initialize in (see [attrs]({{ site.baseurl }}/guide/attrs#default-values)).

Catalyst's member decorators only support public, non-static members. `@controller` (and `@register`) define the element once static fields such as `observedAttributes` and `attrPrefix` are assigned, the same as with legacy decorators.

With standard decorators, that happens while the class is still being defined, before the variable that holds the class is assigned. Defining the element upgrades any matching elements already in the page straight away, so their `connectedCallback` runs at that point. If it, or code it calls, refers to the class by name from outside the class body, such as `element instanceof HelloWorldElement` in a module-level function, TypeScript's output throws a `ReferenceError`. Use `this.constructor`, or keep the reference inside the class body. Some compilers, such as SWC, assign the class first, so this works with them.

Without an explicit name, `@controller` derives the element name from the class name, so the class name must survive your build. With standard decorators, TypeScript's output declares the class twice under the same name, and esbuild renames one of them in any transform or bundle, even at the same target. `HelloWorldElement` then becomes `HelloWorldElement2`, and the element is defined as `hello-world-element2` without an error. esbuild's [`keepNames`](https://esbuild.github.io/api/#keep-names) keeps the name from version 0.18.2. Before that, `@controller` sees an empty or internal name, such as `_this`, and defining the element throws. When esbuild lowers the output to an older target without `keepNames`, it can also produce an internal name, such as `_a2`, which throws too. Minifiers rename classes as well.

Passing the tag name, as in `@controller('hello-world')`, avoids all of this, and we recommend it with standard decorators. See [build considerations]({{ site.baseurl }}/guide/you-will-need#build-considerations).

### Legacy decorators and `useDefineForClassFields`

With legacy decorators, `@target` and `@targets` define a getter on the class prototype. When `useDefineForClassFields` is on, TypeScript defines each declared field on the instance, which hides that getter, so the target is always `undefined`. TypeScript turns `useDefineForClassFields` on by default when `target` is `ES2022` or later.

Marking the field with `!` or `?`, or typing it as `| undefined`, still emits the field. Use `declare`, which emits nothing:

```typescript
@controller
class HelloWorldElement extends HTMLElement {
  @target declare output: HTMLElement | undefined
  @targets declare items: HTMLElement[]
}
```

`@target` returns `undefined` when no element matches, so `| undefined` is the accurate type. `@attr` works either way, because Catalyst redefines `@attr` fields on each instance when it connects. Standard decorators avoid the problem by requiring an [accessor](#standard-decorators).

### Supporting `strictPropertyInitialization`

TypeScript comes with various "strict" mode settings, one of which is `strictPropertyInitialization` which lets TypeScript catch potential class properties which might not be assigned during construction of a class. This option conflicts with Catalyst's `@target`/`@targets` decorators, which safely do the assignment but TypeScript's simple heuristics cannot detect this. There are two ways to work around this:

1. Use TypeScript's [`declare` modifier](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#the-usedefineforclassfields-flag-and-the-declare-property-modifier) to tell TypeScript that the decorated field will still be set up correctly:

    ```typescript
    class HelloWorldElement extends HTMLElement {
      @target declare something: HTMLElement
      @targets declare items: HTMLElement[]
    }
    ```
    
    Note that this only works on TypeScript 3.7+, so if you're on an older version, you can also use the [definite initialization operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#definite-assignment-assertions) to do the same thing, as long as `useDefineForClassFields` is off ([see above](#legacy-decorators-and-usedefineforclassfields)). With [standard decorators](#standard-decorators), use the definite initialization operator on an accessor instead: `@target accessor something!: HTMLElement`.

2. You can also disable the compiler option (other strict mode rules can still apply) in your `tsconfig.json` like so:

    ```json
    {
      "compilerOptions": {
        "strict": true,
        "strictPropertyInitialization": false
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
