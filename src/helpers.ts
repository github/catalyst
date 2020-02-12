function *bindings(selector: string, callingCtor: string) {
  for(const binding of selector.split(' ')) {
    const [_, eventName, ref, ctor, method] = binding.match(/(?:(\w+)((?:@)\w+)?->)(\w+)#(\w+)/) || []
     if (ctor === callingCtor) yield [eventName, ref, method]
  }
}

export function bind(classObject: any) {
  const oldConnectedCallback = classObject.prototype.connectedCallback
  classObject.prototype.connectedCallback = function () {
    if (oldConnectedCallback) oldConnectedCallback.call(this)
    for(const el of this.querySelectorAll('[data-action]')) {
      for (const [eventName, ref, method] of bindings(el.getAttribute('data-action')||'', classObject.name)) {
        let receiver = this
        let delegate = el
        if (ref === 'window') {
          receiver = delegate = window
        } else if (ref === 'document') {
          receiver = delegate = document
        }
        receiver.addEventListener(eventName, (event: Event) => {
          if (event.target === delegate) this[method](event)
        })
      }
    }
  }
}

export function register(classObject: any) {
  const name = classObject.name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase()
  if (!window.customElements.get(name)) {
    window[classObject.name] = classObject;
    window.customElements.define(name, classObject);
  }
}

export function target(proto: any, propertyKey: string) {
  Object.defineProperty(proto, propertyKey, {
    configurable: true,
    get: function() {
      const target = this.querySelector(
        `[data-target=*"${this.constructor.name + "." + propertyKey}"]`
      );
      Object.defineProperty(this, propertyKey, {
        value: target,
        writable: true
      });
      return target;
    },
  });
}
