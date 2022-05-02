---
chapter: 2
subtitle: How to install and set up Catalyst
---

Catalyst is available as an npm module `@github/catalyst`. To install into your project, use the command `npm install @github/catalyst`. 

### TypeScript

Catalyst has no strict dependencies, but it relies on TypeScript for decorator support, so you should also configure your project to use TypeScript. [Read the TypeScript docs on how to set up TypeScript on a new project](https://www.typescriptlang.org/docs/home.html).

### Polyfills

Catalyst uses modern browser standards, and so requires evergreen browsers or may require polyfilling native functionality in older browsers. You'll need to ensure the following features are available:

 - [`toggleAttribute`](https://caniuse.com/#search=toggleAttribute). [`mdn-polyfills`](https://github.com/msn0/mdn-polyfills) or [`dom4`](https://github.com/WebReflection/dom4) libraries can polyfill this.
 - [`window.customElements`](https://caniuse.com/#search=customElements). [`@webcomponents/custom-elements`](https://github.com/webcomponents/polyfills/tree/master/packages/custom-elements) can polyfill this.
 - [`MutationObserver`](https://caniuse.com/#search=MutationObserver). [`mutation-observer`](https://github.com/webmodules/mutation-observer) can polyfill this.

Please note this list may increase over time. Catalyst will never ship with polyfills that add missing browser functionality, but will continue to use the latest Web Standards, and so may require more polyfills as new releases come out.

### Build considerations

When using build tools, some JavaScript minifiers modify the class name that Catalyst relies on. You know you have an issue if you encounter the error `"c" is not a valid custom element name`.

The preferred way to handle this is to disable renaming class names in your build tools.

#### ESBuild

When using ESBuild you can turn off all class and function name minification with the [`keep_names`](https://esbuild.github.io/api/#keep-names) option. Setting this to `true` in your build will opt-out all classes and all functions from minification.


```ts
{ keep_names: true }
// Or --keep-names on the CLI
```

#### Terser

When using Terser you have a bit more control, and can explicitly opt just classes, or just certain class names out of minification. For example to opt-out class names that end with `Element` you can set the following config:

```ts
{ keep_classnames: /Element$/ }
```

It is also possible to set `keep_classnames` to `true` (or pass `--keep-classnames` to the CLI tool), which will opt-out all class names. [You can read more about the minification options on Terser's docs](https://terser.org/docs/api-reference#minify-options)

#### SWC

When using SWC you can use the `keep_classnames` option just like Terser. As SWC also handles Transpilation, you should be sure to enable native class syntax by specifiying `target` to at least `es2016`. [Take a look at the SWC docs for more about compression options](https://swc.rs/docs/configuration/minification#jscminifycompress).

```json
{
  "jsc": {
    "target": "es2016",
    "minify": {
      "compress": {
        "keep_classnames": true
      }
    }
  }
}
```

#### Other alternatives

If your tool chain does not support opting out of minification, or if you would prefer to keep name minification on, you can instead selectively re-assign the `name` field to Catalyst controllers:

```ts
@controller
class UserList extends HTMLElement {
  static name = 'UserList'
}
```

TypeScript decorators only support _class declarations_ which means you will still need to keep the class name between `class` and `extends`. For example the following will be a SyntaxError:

```ts
@controller
class extends HTMLElement {
  static name = 'UserList'
}
```
