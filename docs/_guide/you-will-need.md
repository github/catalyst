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
