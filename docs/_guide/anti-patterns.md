---
chapter: 9
subtitle: Anti Patterns
---

{% capture discouraged %}<h4 class="text-red"><svg class="octicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill-rule="evenodd" d="M1 12C1 5.925 5.925 1 12 1s11 4.925 11 11-4.925 11-11 11S1 18.075 1 12zm8.036-4.024a.75.75 0 00-1.06 1.06L10.939 12l-2.963 2.963a.75.75 0 101.06 1.06L12 13.06l2.963 2.964a.75.75 0 001.061-1.06L13.061 12l2.963-2.964a.75.75 0 10-1.06-1.06L12 10.939 9.036 7.976z"></path></svg> Discouraged</h4>{% endcapture %}

{% capture encouraged %}<h4 class="text-green"><svg class="octicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill-rule="evenodd" d="M1 12C1 5.925 5.925 1 12 1s11 4.925 11 11-4.925 11-11 11S1 18.075 1 12zm16.28-2.72a.75.75 0 00-1.06-1.06l-5.97 5.97-2.47-2.47a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l6.5-6.5z"></path></svg> Encouraged</h4>{% endcapture %}

Here are a few common anti-patterns which we've discovered as developers have used Catalyst. We consider these anti-patterns as they're best avoided, because of surprising edge-cases, or simply because there are easier ways to achieve the same goals.

### Avoid doing any initialisation in the constructor

With conventional classes, it is expected that initialisation will be done in the `constructor()` method. Custom Elements are slightly different, because the `constructor` is called _before_ the element has been put into the Document, which means any initialisation that expects to be connected to a DOM will fail. 

{{ discouraged }}

```typescript
import { controller } from "@github/catalyst"

@controller
class HelloWorldElement extends HTMLElement {
  constructor() {
    // This will fire before DOM is connected, so will never bubble!
    this.dispatchEvent(new CustomEvent('loaded'))
  }
}
```

{{ encouraged }}

```typescript
import { controller } from "@github/catalyst"

@controller
class HelloWorldElement extends HTMLElement {
  connectedCallback() {
    // This will fire _after_ DOM is connected, so will bubble up as expected
    this.dispatchEvent(new CustomEvent('loaded'))
  }
}
```


### Avoid interacting with parents, use Events where possible

Sometimes it's necessary to let ancestors know about the state of a child element, for example when an element loads or needs the parent to change somehow. Sometimes it can be tempting to use methods like `this.closest()` to get a reference to the parent element and interact with it directly, but this creates a fragile coupling to elements and is best avoided. Events can used here, instead:

{{ discouraged }}

<div class="d-flex my-4">
  <div class="">

```typescript
import { controller } from "@github/catalyst"

@controller
class UserSettingsElement extends HTMLElement {
  loading() {
    // While this is loading we need to disable
    // the whole User if `user-profile` ever
    // changes, this code will break!
    this
      .closest('user-profile')
      .disable()
  }
}
```

  </div><div class="ml-4">

```html
<user-profile>
  <user-settings></user-settings>
</user-profile>
```

  </div>
</div>

Instead of interacting with the parent's API directly in JS, you can use `Events` which can be listened to with `data-action`, this moves any coupling into the HTML which already has the association, and so subsequent refactors will have far less risk of breaking the code:

{{ encouraged }}

<div class="d-flex my-4">
  <div class="">

```typescript
import { controller } from "@github/catalyst"

@controller
class UserSettingsElement extends HTMLElement {
  loading() {
    this.dispatchEvent(
      new CustomEvent('loading')
    )
  }
}
```

  </div><div class="ml-4">

```html
<user-profile>
  <user-settings
    data-action="loading:user-profile#disable">
  </user-settings>
  <button >
</user-profile>
```

  </div>
</div>

### Avoid naming methods after events, e.g. `onClick`

When you have a method which is only called as an event, it is tempting to name that method based off of the event, e.g. `onClick`, `onInputFocus`, and so on. This name implies a coupling between the event and method, which later refactorings may break. Also names like `onClick` are very close to `onclick` which is already [part of the Element's API](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onclick). Instead we recommend naming the method after what it does, not how it is called, for example `resetForm`:

{{ discouraged }}

<div class="d-flex my-4">
  <div class="">

```js
import { controller } from "@github/catalyst"

@controller
class UserLoginElement extends HTMLElement {

  // `onClick` is not clear
  onClick() {
    // Log the user in
  }
}
```

  </div>
  <div class="ml-4">

```html
<user-login>
  <!-- ... -->
  <button
    data-action="click:user-login#onClick">
    <!-- `onClick` is not clear -->
    Log In
  </button>
</user-login>
```

  </div>
</div>

{{ encouraged }}

<div class="d-flex my-4">
  <div class="">

```js
import { controller } from "@github/catalyst"

@controller
class UserLoginElement extends HTMLElement {

  login() {
    // Log the user in
  }
}
```

  </div>
  <div class="ml-4">

```html
<user-login>
  <!-- ... -->
  <button
    data-action="click:user-login#login">
    Log In
  </button>
</user-login>
```

  </div>
</div>

### Avoid querying against your element, use `@target` or `@targets`

We find it very common for developers to return to habits and use `querySelector[All]` when needing to get elements. The `@target` and `@targets` decorators were designed to simplify `querySelector[All]` and avoid certain bugs with them (such as nesting issues, and unnecessary coupling) so it's a good idea to use them as much as possible:

{{ discouraged }}

```typescript
class UserList {
  showAdmins() {
    // Just need to get admins here...
    for(const user of this.querySelector('[data-is-admin]')) {
      user.hidden = false
    }
  }
}
```

{{ encouraged }}

```typescript
class UserList {
  @targets admins!: Element[],

  showAdmins() {
    // Just need to get admins here...
    for(const user of this.admins) {
      user.hidden = false
    }
  }
}
```


### Avoid filtering `@targets`, use another `@target` or `@targets`


Sometimes you might need to get a subset of elements from a `@targets` selector. When doing this, simply use another `@target` or `@targets` attribute, it's okay to have many of these! Adding getters which simply return a `@targets` subset has various drawbacks which make it an anti pattern.

For example let's say we have a list of filter checkboxes and checking the "all" checkbox unchecks all other checkboxes:

{{ discouraged }}

```typescript
@controller
class UserFilter {
  @targets filters!: Element[]

  get allFilter() {
    return this.filters.find(el => el.matches('[data-filter="all"]'))
  }

  filter(event: Event) {
    if (event.target === this.allFilter) {
      for(const filter of this.filters) {
        if (filter !== this.allFilter) filter.checked = false
      }
    }
    // ...
  }

}
```

```html
<user-list>
  <input type="checkbox"
    data-action="change:user-list.filter"
    data-target="user-list.filters"
    data-filter="all">Show all</button>
  <input type="checkbox"
    data-action="change:user-list.filter"
    data-target="user-list.filters"
    data-filter="new">New Users</button>
  <input type="checkbox"
    data-action="change:user-list.filter"
    data-target="user-list.filters"
    data-filter="admin">Admins</button>
  <!-- ... --->
</user-filter>
```

While this works well, it could be more easily solved with targets:

{{ encouraged }}

```typescript
@controller
class UserFilter {
  @targets filters!: Element[]
  @target allFilter!: Element

  filter(event: Event) {
    if (event.target === this.allFilter) {
      for(const filter of this.filters) {
        if (filter !== this.allFilter) filter.checked = false
      }
    }
    // ...
  }

}
```

```html
<user-filter>
  <input type="checkbox"
    data-action="change:user-list.filter"
    data-target="user-list.filters user-list.allFilter"
    data-filter="all">Show all</button>
  <input type="checkbox"
    data-action="change:user-list.filter"
    data-target="user-list.filters"
    data-filter="new">New Users</button>
  <input type="checkbox"
    data-action="change:user-list.filter"
    data-target="user-list.filters"
    data-filter="admin">Admins</button>
  <!-- ... --->
</user-filter>
```

