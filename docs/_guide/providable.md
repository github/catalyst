---
chapter: 15
subtitle: The Provider pattern
hidden: true
---

The [Provider pattern](https://www.patterns.dev/posts/provider-pattern/) allows for deeply nested children to ask ancestors for values. This can be useful for decoupling state inside a component, centralising it higher up in the DOM heirarchy. A top level container component might store values, and many children can consume those values, without having logic duplicated across the app. It's quite an abstract pattern so is better explained with examples...

Say for example a set of your components are built to perform actions on a user, but need a User ID. One way to handle this is to set the User ID as an attribute on each element, but this can lead to a lot of duplication. Instead these actions can request the ID from a parent component, which can provide the User ID without creating an explicit relationship (which can lead to brittle code).

The `@providable` ability allows a Catalyst controller to become a provider or consumer (or both) of one or many properties. To provide a property to nested controllers that ask for it, mark a property as `@provide`. To consume a property from a parent, mark a property as `@consume`. Let's try implementing the user actions using `@providable`:

```typescript
import {providable, consume, provide, controller} from '@github/catalyst'

@controller
@providable
class BlockUser extends HTMLElement {
  // This will request `userId`, and default to '' if not provided.
  @consume userId = ''
  // This will request `userName`, and default to '' if not provided.
  @consume userName = ''

  async handleEvent() {
    if (confirm(`Would you like to block ${this.userName}?`)) {
      await fetch(`/users/${userId}/delete`)
    }
  }
}

@controller
@providable
class FollowUser extends HTMLElement {
  // This will request `userId`, and default to '' if not provided.
  @consume userId = ''
  // This will request `userName`, and default to '' if not provided.
  @consume userName = ''

  async handleEvent() {
    if (confirm(`Would you like to follow ${this.userName}?`)) {
      await fetch(`/users/${userId}/delete`)
    }
  }
}

@controller
@providable
class UserRow extends HTMLElement {
    // This will provide `userId` as '123' to any nested children that request it.
    @provide userId = '123'
    // This will provide `userName` as 'Alex' to any nested children that request it.
    @provide userName = 'Alex'
}
```

```html
<user-row>
  <follow-user><button data-action="click:follow-user"></follow-user>
  <block-user><button data-action="click:block-user"></block-user>
</user-row>
```

This shows how the basic pattern works, but `UserRow` having fixed strings isn't very useful. The `@provide` decorator can be combined with other decorators to make it more powerful, for example `@attr`:

```typescript
import {providable, consume, provide, @attr, controller} from '@github/catalyst'

@controller
@providable
class UserRow extends HTMLElement {
  @provide @attr userId = ''
  @provide @attr userName = ''
}
```
```html
<user-row user-id="123" user-name="Alex">
  <follow-user><button data-action="click:follow-user"></follow-user>
  <block-user><button data-action="click:block-user"></block-user>
</user-row>
<user-row user-id="864" user-name="Riley">
  <follow-user><button data-action="click:follow-user"></follow-user>
  <block-user><button data-action="click:block-user"></block-user>
</user-row>
```

Values aren't just limited to strings, they can be any type; for example functions, classes, or even other controllers! We could implement a custom dialog component which exists as a sibling and invoke it using providers and `@target`:


```typescript
import {providable, consume, provide, target, attr, controller} from '@github/catalyst'

@controller
@providable
class UserList extends HTMLElement {
  @provide @target dialog: UserDialogElement
}

@controller
class UserDialog extends HTMLElement {
  setTitle(title: string) {
    this.title.textContent = title
  }
  confirm() {
    this.show()
    return this.untilClosed()
  }
  //...
}

@controller
@providable
class FollowUser extends HTMLElement {
  // This will request `userId`, and default to '' if not provided.
  @consume userId = ''
  // This will request `userName`, and default to '' if not provided.
  @consume userName = ''
  // This will request `dialog`, defaulting it to `null` if not provided:
  @consume dialog: UserDialog | null = null

  async handleEvent() {
    if (!this.dialog) return
    this.dialog.setTitle(`Would you like to follow ${this.userName}?`)
    if (await this.dialog.confirm()) {
      await fetch(`/users/${this.userId}/delete`)
    }
  }
}
```
```html
<user-list>
  <user-row user-id="123" user-name="Alex">
    <follow-user><button data-action="click:follow-user"></follow-user>
    <block-user><button data-action="click:block-user"></block-user>
  </user-row>
  <user-row user-id="864" user-name="Riley">
    <follow-user><button data-action="click:follow-user"></follow-user>
    <block-user><button data-action="click:block-user"></block-user>
  </user-row>

  <user-dialog data-target="user-list.dialog"><!-- ... --></user-dialog>

</user-list>
```

If you're interested to find out how the Provider pattern works, you can look at the [context community-protocol as part of webcomponents-cg](https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md).
