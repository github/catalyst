import type {CustomElementClass} from './custom-element.js'
import {mustDasherize} from './dasherize.js'
import {meta} from './core.js'
import type {MemberContext} from './decorator-context.js'
import {hasOwn, isDecoratorContext, memberName, ownMetadata} from './decorator-context.js'

const attrKey = 'attr'
type attrValue = string | number | boolean

const standardAttrs = Symbol.for('catalyst:attr')

/**
 * Attr is a decorator which tags a property as one to be initialized via
 * `initializeAttrs`.
 *
 * The signature is typed such that the property must be one of a String,
 * Number or Boolean. This matches the behavior of `initializeAttrs`.
 *
 * It supports both TypeScript's `experimentalDecorators` and standard
 * decorators. With standard decorators it can decorate a field, accessor,
 * getter or setter, and records the name in the class's decorator metadata
 * for `@controller` to register.
 */
export function attr<This, Value extends attrValue>(
  value: unknown,
  context: MemberContext<'field' | 'accessor' | 'getter' | 'setter', This, Value>
): void
export function attr<K extends string>(proto: Record<K, attrValue>, key: K): void
export function attr(proto: unknown, keyOrContext: unknown): void {
  if (!isDecoratorContext(keyOrContext)) {
    meta(proto as Record<PropertyKey, unknown>, attrKey).add(keyOrContext as string)
    return
  }
  const name = memberName('attr', keyOrContext, ['field', 'accessor', 'getter', 'setter'])
  const metadata = keyOrContext.metadata as Record<PropertyKey, string[] | undefined> | undefined
  if (!metadata) throw new TypeError('@attr requires decorator metadata (`Symbol.metadata`) support')
  // Metadata inherits from the parent class's metadata, so only append to this class's own list.
  if (hasOwn(metadata, standardAttrs)) metadata[standardAttrs]!.push(name)
  else metadata[standardAttrs] = [name]
}

const registeredStandardAttrs = new WeakSet<object>()

/**
 * Registers the `@attr` members recorded in decorator metadata by standard
 * decorators, so `initializeAttrs` and `defineObservedAttributes` find them.
 *
 * Walks up the class chain to include undecorated base classes, stopping at a
 * class already registered, whose attrs `meta` copies to subclasses. Reads each
 * class's own metadata because a class without a class decorator may get
 * metadata that doesn't inherit from its parent's.
 */
export function registerStandardAttrs(classObject: CustomElementClass): void {
  if (registeredStandardAttrs.has(classObject)) return
  const levels: string[][] = []
  for (
    let current: unknown = classObject;
    typeof current === 'function' && !registeredStandardAttrs.has(current);
    current = Object.getPrototypeOf(current)
  ) {
    const metadata = ownMetadata(current)
    if (metadata && hasOwn(metadata, standardAttrs)) levels.unshift(metadata[standardAttrs] as string[])
  }
  // Base class attrs first, matching the order legacy decorators register them in.
  const attrs = meta(classObject.prototype, attrKey)
  for (const key of levels.flat()) attrs.add(key)
  registeredStandardAttrs.add(classObject)
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
  const proto = Object.getPrototypeOf(instance)
  const prefix = proto?.constructor?.attrPrefix ?? 'data-'
  if (!names) {
    if (typeof proto?.constructor === 'function') registerStandardAttrs(proto.constructor)
    names = meta(proto, attrKey)
  }
  for (const key of names) {
    const value = (<Record<PropertyKey, unknown>>(<unknown>instance))[key]
    const name = mustDasherize(`${prefix}${key}`)
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

export function defineObservedAttributes(classObject: CustomElementClass): void {
  registerStandardAttrs(classObject)
  let observed = classObject.observedAttributes || []

  const prefix = classObject.attrPrefix ?? 'data-'
  const attrToAttributeName = (name: string) => mustDasherize(`${prefix}${name}`)

  Object.defineProperty(classObject, 'observedAttributes', {
    configurable: true,
    get() {
      return [...meta(classObject.prototype, attrKey)].map(attrToAttributeName).concat(observed)
    },
    set(attributes: string[]) {
      observed = attributes
    }
  })
}
