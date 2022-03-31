import { initializeInstance, initializeClass, initializeAttributeChanged } from './core.js'
import type { CustomElement } from './custom-element.js'
/**
 * Controller is a decorator to be used over a class that extends HTMLElement.
 * It will automatically `register()` the component in the customElement
 * registry, as well as ensuring `bind(this)` is called on `connectedCallback`,
 * wrapping the classes `connectedCallback` method if needed.
 */

function decorateWithOptions(decorator: any) {
  if (typeof decorator !== 'function') {
    throw new TypeError(`Decorator must be a function. Received: ${decorator}`);
  }

  return function decoratorWithOptions(...args: any) {
    const argsLength = args.length;

    if (argsLength > 0) {
      const firstArg = args[0];
      const lastArg = args[argsLength - 1];

      // If used as:
      // @decorator
      // decorator(classOrFunction[, option1, option2, ..., optionN])
      if (isClassOrFunction(firstArg)) {
        return decorator(...args);
        // If used as:
        // decorator(option1[, option2, ..., optionN], classOrFunction)
      } else if (isClassOrFunction(lastArg)) {
        args.pop();

        return decorator(lastArg, ...args);
      }
    }

    return function decoratorWrapper(classOrFunction: any) {
      return decorator(classOrFunction, ...args);
    };
  };
}

function isClassOrFunction(value: any) {
  return (typeof value === 'function');
}

function controller(classObject: CustomElement, options: any = {}): void {
  const connect = classObject.prototype.connectedCallback
  classObject.prototype.connectedCallback = function (this: HTMLElement) {
    initializeInstance(this, connect)
  }
  const attributeChanged = classObject.prototype.attributeChangedCallback
  classObject.prototype.attributeChangedCallback = function (
    this: HTMLElement,
    name: string,
    oldValue: unknown,
    newValue: unknown
  ) {
    initializeAttributeChanged(this, name, oldValue, newValue, attributeChanged)
  }
  initializeClass(classObject, options)
}
const c = decorateWithOptions(controller)
export { c as controller} 