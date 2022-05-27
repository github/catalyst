---
chapter: 16
subtitle: The Loadable pattern
hidden: true
---

A common pattern in client-side UI development is to load data from a server. The HTML standard already defines some elements that do that like the `<img>` and `<iframe>` elements. These elements use a loading pattern that consists of a `src` attribute pointing to a resource to load, a `loading` attribute to denote lazy-loading when the element is visible on the page, a `fetchpriority` attribute for fine-tuning priority, and they also emit events during the loading life-cycle. These all add up to a great API but it can be daunting to implement.

The `@loadable` ability provides all these mechanics for your Catalyst controller. To implement this pattern in your Catalyst controller, decorate it with the `@loadable` decorator and implement the `load` function like we do in the example below:

```typescript
import {loadable, controller} from '@github/catalyst'

@controller
@loadable
class StarRating extends HTMLElement {
  load(response: Response) {
    const html = await response.text()
    this.innerHTML = html
  }
}
```

```html
<star-rating src="/star-rating/5">
  I'm skeleton UI!
</star-rating>

<star-rating src="/star-rating/5" loading="lazy" fetchpriority="low">
  I'm skeleton UI!
</star-rating>
```
