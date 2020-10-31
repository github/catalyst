---
chapter: 10
subtitle: Patterns
---

An aim of Catalyst is to be as light weight as possible, and so we often avoid including helper functions for otherwise fine code. We also want to keep Catalyst focussed, and so where some helper functions might be reasonable, we recommend judicious use of other small libraries.

Here are a few common patterns which we've avoided introducing into the Catalyst code base, and instead encourage you to take the example code and run with that:

### Debouncing or Throttling events

Often times you'll want to do something computationally intensive (or network intensive) based on a user event. It's worth throttling the amount of times a function can be called for these events, to prevent saturation of the CPU or network. For this we can use the "debounce" or "throttle" patterns. We recommend using the [`@github/mini-throttle`](https://github.com/github/mini-throttle) library for this, which provides throttling decorators for methods:

```typescript
import {controller} from '@github/catalyst'
import {debounce} from '@github/mini-throttle/decorators'

@controller
class FuzzySearchElement extends HTMLElement {

  // Adding `@debounce(100)` here means this method will only be called once in a 100ms period.
  @debounce(100)
  search(event: Event) {
    const value = event.currentTarget.value
    // This function is very computationally intensive, so we should run it as little as possible
    this.filterAllItemsWithValue(value)
  }

}
```

### Aborting Network Requests

When making network requests using `fetch`, based on user input, you can cancel old requests as new ones come in. This is useful for performance as well as UI responsiveness, as old requests that aren't cancelled might complete later than newer ones, and causing the UI to jump around. Aborting network requests requires you to use [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) (a web platform feature).

```typescript
@controller
class RemoveSearchElement extends HTMLElement {

  #remoteSearchController: AbortController|null

  async search(event: Event) {
    // Abort the old Request
    this.#remoteSearchController?.abort()

    // To start making a new request, construct an AbortController
    const {signal} = (this.#remoteSearchController = new AbortController())

    try {
      const res = await fetch(myUrl, {signal})

      // ... Add logic here with the completed network response
    } catch (e) {

      // ... Add logic here if you need to report a failed network request.
      // Do not rethrow for network errors!

    }

    if (signal.aborted) {
      // Here you can add logic for if the request was cancelled, but
      // usually what you want to do is just return early to avoid
      // cleaning up the loading UI (bear in mind if the request is
      // cancelled then another one will be in its place).
      return
    }

    // ... Add cleanup logic here, such as removing `loading` classes.

  }
}
```
