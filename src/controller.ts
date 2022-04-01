import {initializeInstance, initializeClass, initializeAttributeChanged} from './core.js'
import type {CustomElement} from './custom-element.js'
/**
 * Controller is a decorator to be used over a class that extends HTMLElement.
 * It will automatically `register()` the component in the customElement
 * registry, as well as ensuring `bind(this)` is called on `connectedCallback`,
 * wrapping the classes `connectedCallback` method if needed.
 */

function controllerWapper(...args: any): any { 
  /* 
    a wapper to handle the controller decorator when used as
    @controller or @controller({extends: x}).
    
    Notes about args value:
      - IF used as @controller THEN args[0] = classObject
      - IF used as @controller({extends: x}) THEN args[0] = {extends: x}
  */ 

  // handle @controller
  if (args[0].prototype instanceof HTMLElement) {
    return controller(args[0])
  }

  // handle @controller({extends: x})
  return function (classObject: CustomElement): void {
    return controller(classObject, args[0])
  }
}

function controller (classObject: CustomElement, options: any = {}): void {
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

export {controllerWapper as controller}