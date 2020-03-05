---
chapter: 5
subtitle: Querying Descendants
---

Catalyst Components are just Web Components, and so you can simply use `querySelector` or `querySelectorAll` to select descendants of the element. Targets, however, provide a more consistent interface for accessing descendants. 

### Example

<div class="d-flex my-4">
  <div class="">

```html
<hello-controller>
  <span
    data-target="hello-controller.output">
  </span>
</div>
```

  </div>
  <div class="ml-4">

```js
import { target } from "@catalyst/ts"

class HelloController extends Controller {
  @target outputTarget: HTMLElement

  greet() {
    this.outputTarget.textContent = `Hello, world!`
  }
}
```

  </div>
</div>

### Target Syntax

The target syntax follows a pattern of `controller.target`.

 - `controller` must be the name of a controller ascendant to the element.
 - `target` must be the name matching that of a `@target` (or `@targets`) annotated field within the Controller code.

### Multiple Targets

Elements can be referenced as multiple targets, and targets may be referenced multiple times within the HTML:

```html
<teammembers-controller>
  <userlist-controller>
    <user-controller data-target="userlist-controller.user">
      <input type="checkbox" data-target="teammembers-controller.read-checkbox">
      <input type="checkbox" data-target="teammembers-controller.write-checkbox">
    </user-controller>
    <user-controller data-target="userlist-controller.user">
      <input type="checkbox" data-target="teammembers-controller.read-checkbox">
      <input type="checkbox" data-target="teammembers-controller.write-checkbox">
    </user-controller>
  </userlist-controller>
</teammembers-controller>
```

### Single vs Plural

There are two decorators available, `@target` which fetches only one element, and `@targets` which fetches multiple. It is important to distinguish between the two.

### How are actions registered?

If you're using decorators, then the `@target` and `@targets` decorators will turn the decorated properties into getters.

If you're not using decorators, then you'll need to call `findTarget(this, key)` or `findTargets(this, key)` in the getter, for example:

```js
import {findTarget, findTargets} from '@catalyst/core'
class MyController extends HTMLElement {

  get outputTarget() {
    return findTarget(this, 'outputTarget')
  }

  get pages() {
    return findTargets(this, 'pages')
  }

}
```
