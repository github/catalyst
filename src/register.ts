import type {CustomElementClass} from './custom-element.js'
import type {ClassContext} from './decorator-context.js'
import {assertClass, isDecoratorContext} from './decorator-context.js'
import {dasherize} from './dasherize.js'

/**
 * Register the controller as a custom element.
 *
 * The classname is converted to a appropriate tag name.
 *
 * Example: HelloController => hello-controller
 *
 * It can be used as a class decorator with both TypeScript's
 * `experimentalDecorators` and standard decorators.
 */
// The legacy overload comes first, so calls with untyped arguments resolve to it, and last, so `ReturnType` and
// `Parameters` read it.
export function register(classObject: CustomElementClass, name?: string): CustomElementClass
export function register<C extends CustomElementClass>(classObject: C, context: ClassContext<C>): void
export function register(classObject: CustomElementClass, name?: string): CustomElementClass
export function register(classObject: CustomElementClass, nameOrContext?: unknown): CustomElementClass | void {
  if (isDecoratorContext(nameOrContext)) {
    assertClass('register', nameOrContext)
    // Like `@controller`, define the element once static fields are assigned.
    // Like legacy decorators, register the class this decorator received, even if an outer decorator replaced it.
    ;(nameOrContext as ClassContext<CustomElementClass>).addInitializer(() => register(classObject))
    return
  }
  const name = nameOrContext as string | undefined
  const tagName = name || dasherize(classObject.name).replace(/-element$/, '')

  try {
    window.customElements.define(tagName, classObject)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window[classObject.name] = customElements.get(tagName)
  } catch (e: unknown) {
    // The only reason for window.customElements.define to throw a `NotSupportedError`
    // is if the element has already been defined.
    if (!(e instanceof DOMException && e.name === 'NotSupportedError')) throw e
  }
  return classObject
}
