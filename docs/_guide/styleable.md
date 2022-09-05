---
chapter: 8
subtitle: Bringing CSS into ShadowDOM
hidden: true
---

Components with ShadowDOM typically want to introduce some CSS into their ShadowRoots. This is done with the use of `adoptedStyleSheets`, which can be a little cumbersome, so Catalyst provides the `@style` decorator and `css` utility function to more easily add CSS to your component.

If your CSS lives in a different file, you can import the file with using the `assert { type: 'css' }` import assertion. You might need to configure your bundler tool to allow for this. If you're unfamiliar with this feature, you can [check out the web.dev article on CSS Module Scripts](https://web.dev/css-module-scripts/):

```typescript
import {controller, style} from '@github/catalyst'
import DesignSystemCSS from './my-design-system.css' assert { type: 'css' }

@controller
class UserRow extends HTMLElement {
  @style designSystem = DesignSystemCSS

  connectedCallback() {
    this.attachShadow({ mode: 'open' })
    // adoptedStyleSheets now includes our DesignSystemCSS!
    console.assert(this.shadowRoot.adoptedStyleSheets.includes(this.designSystem))
  }
}
```

Multiple `@style` tags are allowed, each one will be applied to the `adoptedStyleSheets` meaning you can split your CSS without worry!

```typescript
import {controller} from '@github/catalyst'
import UtilityCSS from './my-design-system/utilities.css' assert { type: 'css' }
import NormalizeCSS from './my-design-system/normalize.css' assert { type: 'css' }
import UserRowCSS from './my-design-system/components/user-row.css' assert { type: 'css' }

@controller
class UserRow extends HTMLElement {
  @style utilityCSS = UtilityCSS
  @style normalizeCSS = NormalizeCSS
  @style userRowCSS = UserRowCSS

  connectedCallback() {
    this.attachShadow({ mode: 'open' })
  }
}
```

### Defining CSS in JS

Sometimes it can be useful to define small snippets of CSS within JavaScript itself, and so for this we have the `css` helper function which can create a `CSSStyleSheet` object on-the-fly:

```typescript
import {controller, style, css} from '@github/catalyst'

@controller
class UserRow extends HTMLElement {
  @style componentCSS = css`:host { display: flex }`

  connectedCallback() {
    this.attachShadow({ mode: 'open' })
  }
}
```

As always though, the best way to handle dynamic per-instance values is with CSS variables:

```typescript
import {controller, style, css} from '@github/catalyst'

const sizeCSS = (size = 1) => css`:host { font-size: var(--font-size, ${size}em); }`

@controller
class UserRow extends HTMLElement {
  @style componentCSS = sizeCSS

  @attr set fontSize(n: number) {
    this.style.setProperty('--font-size', n)
  }
}
```
```html
<user-row font-size="1">Alex</user-row>
<user-row font-size="3">Riley</user-row>
```

The `css` function is memoized; it will always return the same `CSSStyleSheet` object for every callsite. This allows you to "lift" it into a function that can change the CSS for all components by calling the function, which will replace the CSS inside it.

```typescript
import {controller, style, css} from '@github/catalyst'

const sizeCSS = (size = 1) => css`:host { font-size: ${size}em; }`

// Calling sizeCSS will always result in the same CSSStyleSheet object
console.assert(sizeCSS(1) === sizeCSS(2))

@controller
class UserRow extends HTMLElement {
  @style componentCSS = sizeCSS

  #size = 1
  makeAllUsersLargerFont() {
    sizeCSS(this.#size++)
  }
}
```
