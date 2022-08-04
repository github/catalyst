---
chapter: 17
subtitle: Dynamically load elements just in time
---

A common practice in modern web development is to combine all JavaScript code into JS "bundles". By bundling the code together we avoid the network overhead of fetching each file. However the trade-off of bundling is that we might deliver JS code that will never run in the browser.

![A screenshot from Chrome Devtools showing the Coverage panel. The panel has multiple request to JS assets and it shows that most of them have large chunks that are unused.](/catalyst/guide/devtools-coverage.png)

An alternative solution to bundling is to load JavaScript just in time. Downloding the JavaScript for Catalyst controllers when the browser first encounters them can be done with the `lazyDefine` function.

```typescript
import {lazyDefine} from '@github/catalyst'

// Dynamically import the Catalyst controller when the `<user-avatar>` tag is seen.
lazyDefine('user-avatar', () => import('./components/user-avatar'))
```

Serving this file allows us to defer loading of the component code until it's actually needed by the web page. The tradeoff of deferring loading is that the elements will be inert until the dynamic import of the component code resolves. Consider what your UI might look like while these components are resolving. Consider providing a loading indicator and disabling controls as the default state. The smaller the component, the faster it will resolve which means that your users might not notice a inert state. A good rule of thumb is that a component should load within 100ms on a "Fast 3G" connection.

Generally we think it's a good idea to `lazyDefine` all elements and then prioritize eager loading of ciritical elements as needed. You might consider using code-generation to generate a file lazy defining all your components.

By default the component will be loaded when the element is present in the document and the document has finished loading. This can happen before sub-resources such as scripts, images, stylesheets and frames have finished loading. It is possible to defer loading even later by adding a `data-load-on` attribute on your element. The value of which must be one of the following prefefined values:

- `<user-avatar data-load-on="ready"></user-avatar>` (default)
	- The element is loaded when the document has finished loading. This listens for changes to `document.readyState` and triggers when it's no longer loading.
- `<user-avatar data-load-on="firstInteraction"></user-avatar>` 
	- This element is loaded on the first user interaction with the page. This listens for `mousedown`, `touchstart`, `pointerdown` and `keydown` events on `document`.
- `<user-avatar data-load-on="visible"></user-avatar>`
	- This element is loaded when it's close to being visible. Similar to `<img loading="lazy" [..] />` . The functionality is driven by an `IntersectionObserver`.

This functionality is similar to the ["Lazy Custom Element Definitions" spec proposal](https://github.com/WICG/webcomponents/issues/782) and as this proposal matures we see Catalyst conforming to the spec and leveraging this new API to lazy load elements.
