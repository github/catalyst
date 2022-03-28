import type {CustomElement} from './custom-element.js'

const attrs = new WeakMap<Record<PropertyKey, unknown>, string[]>()
type attrValue = string | number | boolean

/**
 * Attr is a decorator which tags a property as one to be initialized via
 * `initializeAttrs`.
 *
 * The signature is typed such that the property must be one of a String,
 * Number or Boolean. This matches the behavior of `initializeAttrs`.
 */
export function attr<K extends string>(proto: Record<K, attrValue>, key: K): void {
  if (!attrs.has(proto)) attrs.set(proto, [])
  attrs.get(proto)!.push(key)
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
const initialized = new WeakSet<Element>()
export function initializeAttrs(instance: HTMLElement, names?: Iterable<string>): void {
  if (initialized.has(instance)) return
  initialized.add(instance)
  if (!names) names = getAttrNames(Object.getPrototypeOf(instance))
  for (const key of names) {
    const value = (<Record<PropertyKey, unknown>>(<unknown>instance))[key]
    const name = attrToAttributeName(key)
    let descriptor: PropertyDescriptor = {
      configurable: true,
      get(this: HTMLElement): string {
        return this.getAttribute(name) || ''
      },
      set(this: HTMLElement, newValue: string) {
        this.setAttribute(name, newValue || '')
      }
    }
    if (typeof value === 'number') {
      descriptor = {
        configurable: true,
        get(this: HTMLElement): number {
          return Number(this.getAttribute(name) || 0)
        },
        set(this: HTMLElement, newValue: string) {
          this.setAttribute(name, newValue)
        }
      }
    } else if (typeof value === 'boolean') {
      descriptor = {
        configurable: true,
        get(this: HTMLElement): boolean {
          return this.hasAttribute(name)
        },
        set(this: HTMLElement, newValue: boolean) {
          this.toggleAttribute(name, newValue)
        }
      }
    }
    Object.defineProperty(instance, key, descriptor)
    if (key in instance && !instance.hasAttribute(name)) {
      descriptor.set!.call(instance, value)
    }
  }
}

function getAttrNames(classObjectProto: Record<PropertyKey, unknown>): Set<string> {
  const names: Set<string> = new Set()
  let proto: Record<PropertyKey, unknown> | typeof HTMLElement = classObjectProto

  while (proto && proto !== HTMLElement) {
    const attrNames = attrs.get(<Record<PropertyKey, unknown>>proto) || []
    for (const name of attrNames) names.add(name)
    proto = Object.getPrototypeOf(proto)
  }

  return names
}

function attrToAttributeName(name: string): string {
  return `data-${name.replace(/([A-Z]($|[a-z]))/g, '-$1')}`.replace(/--/g, '-').toLowerCase()
}

export function defineObservedAttributes(classObject: CustomElement): void {
  let observed = classObject.observedAttributes || []
  Object.defineProperty(classObject, 'observedAttributes', {
    configurable: true,
    get() {
      const attrMap = getAttrNames(classObject.prototype)
      return [...attrMap].map(attrToAttributeName).concat(observed)
    },
    set(attributes: string[]) {
      observed = attributes
    }
  })
}
