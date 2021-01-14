import {CustomElement} from './custom-element'

const attrs = new WeakMap<Record<PropertyKey, unknown>, Set<string>>()
type attrValue = string | number | boolean

/**
 * Attr is a decorator which tags a property as one to be initialized via
 * `initializeAttrs`.
 *
 * The signature is typed such that the property must be one of a String,
 * Number or Boolean. This matches the behavior of `initializeAttrs`.
 */
export function attr<K extends string>(proto: Record<K, attrValue>, key: K): void {
  if (!attrs.has(proto)) attrs.set(proto, new Set())
  attrs.get(proto)!.add(key)
}

/**
 * initializeAttrs is called with a set of class property names (if omitted, it
 * will look for any properties tagged with the `@attr` decorator). With this
 * list it defines property descriptors for each property that map to `data-*`
 * attributes on the HTMLElement instance.
 *
 * It works around Native Class Property semantics - which are equivalent to
 * calling `Object.defineProperty` on the instance upon creation, but before
 * `constructor()` is called.
 *
 * If a class property is assigned to the class body, it will infer the type
 * (using `typeof`) and define an appropriate getter/setter combo that aligns
 * to that type. This means class properties assigned to Numbers can only ever
 * be Numbers, assigned to Booleans can only ever be Booleans, and assigned to
 * Strings can only ever be Strings.
 *
 * This is automatically called as part of `@controller`. If a class uses the
 * `@controller` decorator it should not call this manually.
 */
export function initializeAttrs(instance: HTMLElement, names?: Iterable<string>): void {
  if (!names) names = attrs.get(Object.getPrototypeOf(instance)) || []
  for (const key of names) {
    const value = (<Record<PropertyKey, unknown>>(<unknown>instance))[key]
    let descriptor: PropertyDescriptor
    if (typeof value === 'number') {
      descriptor = numberProperty(key)
    } else if (typeof value === 'boolean') {
      descriptor = booleanProperty(key)
    } else {
      descriptor = stringProperty(key)
    }
    Object.defineProperty(instance, key, descriptor)
    if (key in instance && !instance.hasAttribute(attrToAttributeName(key))) {
      descriptor.set!.call(instance, value)
    }
  }
}

function booleanProperty(key: string): PropertyDescriptor {
  const attributeName = attrToAttributeName(key)
  return {
    get(this: HTMLElement): boolean {
      return this.hasAttribute(attributeName)
    },
    set(this: HTMLElement, value: boolean) {
      this.toggleAttribute(attributeName, value)
    }
  }
}

function stringProperty(key: string): PropertyDescriptor {
  const attributeName = attrToAttributeName(key)
  return {
    get(this: HTMLElement): string {
      return String(this.getAttribute(attributeName) || '')
    },
    set(this: HTMLElement, value: string) {
      this.setAttribute(attributeName, value || '')
    }
  }
}

function numberProperty(key: string): PropertyDescriptor {
  const attributeName = attrToAttributeName(key)
  return {
    get(this: HTMLElement): number {
      return Number(this.getAttribute(attributeName) || 0)
    },
    set(this: HTMLElement, value: number) {
      this.setAttribute(attributeName, String(value))
    }
  }
}

function attrToAttributeName(name: string): string {
  return `data-${name.replace(/([A-Z]($|[a-z]))/g, '-$1')}`.replace(/--/g, '-').toLowerCase()
}

export function defineObservedAttributes(classObject: CustomElement): void {
  let observed = classObject.observedAttributes || []
  Object.defineProperty(classObject, 'observedAttributes', {
    get() {
      const attrMap = attrs.get(classObject.prototype)
      if (!attrMap) return observed
      return [...attrMap].map(attrToAttributeName).concat(observed)
    },
    set(attributes: string[]) {
      observed = attributes
    }
  })
}
