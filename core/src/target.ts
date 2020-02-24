import {dasherize} from './dasherize'

/**
 * Create a property on the controller instance referencing the element with a
 * `data-target` element of the same name.
 */

const createSelector = (receiver: Element, key: string) => `[data-target*="${receiver.tagName.toLowerCase()}.${key}"]`

export function target(proto: object, key: string) {
  Object.defineProperty(
    proto,
    key,
    {
      configurable: true,
      get: function() {
        return this.querySelectorAll(createSelector(this, key)).find((el: Element) => el.closest(this.tagName) === this)
      },
    }
  );
}

export function targets(proto: object, key: string) {
  Object.defineProperty(
    proto,
    key,
    {
      configurable: true,
      get: function() {
        return this.querySelectorAll(createSelector(this, key)).filter((el: Element) => el.closest(this.tagName) === this)
      },
    }
  );
}

export function assertTargets(_: object) {
  // This is an empty stub that does nothing at runtime, but can be used by
  // compilers to generate code that asserts Targets are the Element types they
  // declare themselves to be, otherwise throw an Invariant Error.
}
