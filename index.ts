function bindActions(classObject) {
  const oldConnectedCallback = classObject.prototype.connectedCallback
  classObject.prototype.connectedCallback = function () {
    if (oldConnectedCallback) oldConnectedCallback.call(this)
    for(const binding of this.querySelectorAll('[data-action]')) {
      const [_, eventName, ctor, method] = (binding.getAttribute('data-action')||'').match(/^(\w+)->(\w+)#(\w+)$/) || []
      if (ctor.toLowerCase() === classObject.name.toLowerCase()) {
        this.addEventListener(eventName, ev => this[method](ev))
      }
    }
  }
}

function controllerElement(classObject) {
  const name = classObject.name.toLowerCase() + "-controller";
  bindActions(classObject)
  if (!window.customElements.get(name)) {
    window[classObject.name + "Controller"] = classObject;
    window.customElements.define(name, classObject);
  }
}

function target(proto, propertyKey) {
  Object.defineProperty(proto, propertyKey + "Target", {
    get: function() {
      console.log('get target', propertyKey)
      console.log(`[data-target="${this.constructor.name.toLowerCase() + "." + propertyKey}"]`)
      const target = this.querySelector(
        `[data-target="${this.constructor.name.toLowerCase() + "." + propertyKey}"]`
      );
      if (!(target instanceof this[propertyKey])) {
        throw new Error("Invariant: expected target to be instanceof " + this[propertyKey] + " but saw " + target)
      }
      Object.defineProperty(this, propertyKey + "Target", {
        value: target,
        writable: true
      });
      return target;
    }
  });
}

/********************************************************************/

@controllerElement
class Hello extends HTMLElement {
  @target name = HTMLInputElement;
  @target output = HTMLElement;

  greet() {
    this.outputTarget.textContent = `Hello, ${this.nameTarget.value}!`;
  }
}
