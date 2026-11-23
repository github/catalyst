import type {CustomElementClass} from './custom-element.js'
import type {ClassContext} from './decorator-context.js'
import {isDecoratorContext, nameAs, receiveClass, receivedNames} from './decorator-context.js'
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
    receiveClass('register', nameOrContext, classObject)
    // Like `@controller`, define the element once static fields are assigned. Define the class an outer decorator
    // returned, which static fields and metadata are assigned to, under the name of the class this decorator received.
    ;(nameOrContext as ClassContext<CustomElementClass>).addInitializer(function (this: CustomElementClass) {
      nameAs(this, classObject)
      register(this)
    })
    return
  }
  const name = nameOrContext as string | undefined
  const className = receivedNames.get(classObject) ?? classObject.name
  const tagName = name || dasherize(className).replace(/-element$/, '')

  try {
    window.customElements.define(tagName, classObject)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window[className] = customElements.get(tagName)
  } catch (e: unknown) {
    // The only reason for window.customElements.define to throw a `NotSupportedError`
    // is if the element has already been defined.
    if (!(e instanceof DOMException && e.name === 'NotSupportedError')) throw e
  }
  return classObject
}
