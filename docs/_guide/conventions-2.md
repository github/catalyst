---
version: 2
chapter: 13
title: Conventions
subtitle: Common naming and patterns
permalink: /guide-v2/conventions
---

Catalyst strives for convention over code. Here are a few conventions we recommend when writing Catalyst code:

### Suffix your controllers consistently, for symmetry

Catalyst components can be suffixed with `Element`, `Component` or `Controller`. We think elements should behave as closely to the built-ins as possible, so we like to use `Element` (existing elements do this, for example `HTMLDivElement`, `SVGElement`). If you're using a server side comoponent framework such as [ViewComponent](https://viewcomponent.org/), it's probably better to suffix `Component` for symmetry with that framework.

```typescript
@controller
class UserListElement extends HTMLElement {} // `<user-list />`
```

```typescript
@controller
class UserListComponent extends HTMLElement {} // `<user-list />`
```

### The best class-names are two word descriptions

Custom elements are required to have a `-` inside the tag name. Catalyst's `@controller` will derive the tag name from the class name - and so as such the class name needs to have at least two capital letters, or to put it another way, it needs to consist of at least two CamelCased words. The element name should describe what it does succinctly in two words. Some examples:

 - `theme-picker` (`class ThemePickerElement`)
 - `markdown-toolbar` (`class MarkdownToolbarElement`)
 - `user-list` (`class UserListElement`)
 - `content-pager` (`class ContentPagerElement`)
 - `image-gallery` (`class ImageGalleryElement`)

If you're struggling to come up with two words, think about one word being the "what" (what does it do?) and another being the "how" (how does it do it?).

### Keep class-names short (but not too short)

Brevity is good, element names are likely to be typed out a lot, especially throughout HTML in as tag names, and `data-target`, `data-action` attributes. A good rule of thumb is to try to keep element names down to less than 15 characters (excluding the `Element` suffix), and ideally less than 10. Also, longer words are generally harder to spell, which means mistakes might creep into your code.

Be careful not to go too short! We'd recommend avoiding contracting words such as using `Img` to mean `Image`. It can create confusion, especially if there are inconsistencies across your code!

### Method names should describe what they do

A good method name, much like a good class name, describes what it does, not how it was invoked. While methods can be given most names, you should avoid names that conflict with existing methods on the `HTMLElement` prototype (more on that in [anti-patterns]({{ site.baseurl }}/guide/anti-patterns#avoid-shadowing-method-names)). Names like `onClick` are best avoided, overly generic names like `toggle` should also be avoided. Just like class names it is a good idea to ask "how" and "what", so for example `showAdmins`, `filterUsers`, `updateURL`.

### `@target` should use singular naming, while `@targets` should use plural

To help differentiate the two `@target`/`@targets` decorators, the properties should be named with respective to their cardinality. That is to say, if you're using an `@target` decorator, then the name should be singular (e.g. `user`, `field`) while the `@targets` decorator should be coupled with plural property names (e.g. `users`, `fields`).

