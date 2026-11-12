import {CatalystDelegate} from './core.js'
import {registerStandardAttrs} from './attr.js'
import type {CustomElementClass} from './custom-element.js'
import type {ClassContext} from './decorator-context.js'
import {isDecoratorContext} from './decorator-context.js'

/**
 * The decorator returned by `controller(name)`. It accepts both TypeScript's
 * `experimentalDecorators` and standard decorator calls.
 */
export interface ControllerDecorator {
  <C extends CustomElementClass>(classObject: C, context: ClassContext<C>): void
  (classObject: CustomElementClass): void
}

/**
 * Controller is a decorator to be used over a class that extends HTMLElement.
 * It will automatically `register()` the component in the customElement
 * registry, as well as ensuring `bind(this)` is called on `connectedCallback`,
 * wrapping the classes `connectedCallback` method if needed.
 *
 * It supports both TypeScript's `experimentalDecorators` and standard
 * decorators.
 */
export function controller<C extends CustomElementClass>(classObject: C, context: ClassContext<C>): void
export function controller(classObject: CustomElementClass): void
export function controller(name: string): ControllerDecorator
export function controller(
  classObjectOrName: CustomElementClass | string,
  context?: unknown
): void | ControllerDecorator {
  if (typeof classObjectOrName === 'string') {
    const name = classObjectOrName
    return (classObject: CustomElementClass, classContext?: unknown) => decorate(classObject, classContext, name)
  }
  decorate(classObjectOrName, context)
}

function decorate(classObject: CustomElementClass, context: unknown, name?: string) {
  if (!isDecoratorContext(context)) return defineController(classObject, name)
  // Standard class decorators run before static fields such as `observedAttributes` and `attrPrefix` are assigned.
  // Class initializers run after them, which is when legacy class decorators run.
  const classContext = context as ClassContext<CustomElementClass>
  classContext.addInitializer(function (this: CustomElementClass) {
    defineController(this, name)
  })
}

function defineController(classObject: CustomElementClass, name?: string) {
  // Picks up `@attr` members compiled as standard decorators, including when `controller` is called directly.
  registerStandardAttrs(classObject)
  new CatalystDelegate(classObject, name)
}
