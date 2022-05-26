---
chapter: 14
subtitle: Abilities
hidden: true
---

Under the hood Catalyst's controller decorator is comprised of a handful of separate "abilities". An "ability" is essentially a mixin or perhaps "higher order class". An ability takes a class and returns an extended class that adds additional behaviours. By convention all abilities exported by Catalyst are suffixed with `able` which we think is a nice way to denote that something is an ability and should be used as such.

### Using Abilities

Abilities are fundementally just class decorators, and so can be used just like the `@controller` decorator. For example to add only the `actionable` decorator (which automatically binds events based on `data-action` attributes):

```typescript
import {actionable} from '@github/catalyst'

@actionable
class HelloWorld extends HTMLElement {
}
```

### Using Marks

Abilities also come with complementary field decorators which we call "marks" (we give them a distinctive name because they're a more restrictive subset of field decorators). Marks annotate fields which abilities can then extend with custom logic, both [Targets]({{ site.baseurl }}/guide/targets) and [Attrs]({{ site.baseurl }}/guide/attrs) are abilities that use marks. The `targetable` ability includes `target` & `targets` marks, and the `attrable` ability includes the `attr` mark. Marks decorate individual fields, like so:

```typescript
import {targetable, target, targets} from '@github/catalyst'

@targetable
class HelloWorldElement extends HTMLElement {
    @target name
    @targets people
}
```

Marks _can_ decorate over fields, get/set functions, or class methods - but individual marks can set their own validation logic, for example enforcing a naming pattern or disallowing application on methods.

### Built-In Abilities

Catalyst ships with a set of built in abilities. The `@controller` decorator applies the following built-in abilities:

- `controllable` - the base ability which other abilities require for functionality.
- `targetable` - the ability to define `@target` and `@targets` properties. See [Targets]({{ site.baseurl }}/guide/targets) for more.
- `actionable` - the ability to automatically bind events based on `data-action` attributes. See [Actions]({{ site.baseurl }}/guide/actions) for more.
- `attrable` - the ability to define `@attr`s. See [Attrs]({{ site.baseurl }}/guide/attrs) for more.

The `@controller` decorator also applies the `@register` decorator which automatically registers the element in the Custom Element registry, however this decorator isn't an "ability".

The following abilities are shipped with Catalyst but require manually applying as they aren't considered critical functionality:

 - `providable` - the ability to define `provider` and `consumer` properties. See [Providable]({{ site.baseurl }}/guide/providable) for more.

In addition to the provided abilities, Catalyst provides all of the tooling to create your own custom abilities. Take a look at the [Create Ability]({{ site.baseurl }}/guide/create-ability) documentation for more!
