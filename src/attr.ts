import type {CustomElementClass} from './custom-element.js'
import {mustDasherize} from './dasherize.js'
import {meta, ownMeta} from './core.js'
import type {ClassContext, MemberContext} from './decorator-context.js'
import {hasOwn, isDecoratorContext, memberName} from './decorator-context.js'

const attrKey = 'attr'
type attrValue = string | number | boolean

// Standard decorators apply getter and setter decorators before field decorators, so record them separately and
// register stored values first. A getter may read another attr while it initializes; a stored value can't.
const standardAttrs = Symbol.for('catalyst:attr')
const standardComputedAttrs = Symbol.for('catalyst:attr:computed')

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
export function attr<K extends string, This extends Record<K, attrValue>, Value extends attrValue>(
  value: unknown,
  context: MemberContext<'field' | 'accessor' | 'getter' | 'setter', This, Value> & {readonly name: K}
): void
export function attr<K extends string>(proto: Record<K, attrValue>, key: K): void
export function attr(proto: unknown, keyOrContext: unknown, descriptor?: PropertyDescriptor): void {
  if (!isDecoratorContext(keyOrContext)) {
    const attrs = meta(proto as Record<PropertyKey, unknown>, attrKey)
    // Legacy decorators only pass a descriptor to getters and setters. Like standard ones, an overriding getter moves
    // after the attrs its class declares before it, which it may read.
    if (descriptor) attrs.delete(keyOrContext as string)
    attrs.add(keyOrContext as string)
    return
  }
  const name = memberName('attr', keyOrContext, ['field', 'accessor', 'getter', 'setter'])
  const metadata = keyOrContext.metadata as Record<PropertyKey, string[] | undefined> | undefined
  if (!metadata) throw new TypeError('@attr requires decorator metadata (`Symbol.metadata`) support')
  const key = keyOrContext.kind === 'getter' || keyOrContext.kind === 'setter' ? standardComputedAttrs : standardAttrs
  // Metadata inherits from the parent class's metadata, so only append to this class's own list.
  if (hasOwn(metadata, key)) metadata[key]!.push(name)
  else metadata[key] = [name]
}

/**
 * Returns the `@attr` members recorded in the class's own decorator metadata. Finds the metadata by these lists rather
 * than by `Symbol.metadata`, because another library may redefine `Symbol.metadata` after some classes are defined.
 */
function ownStandardAttrs(classObject: object): string[][] {
  for (const symbol of Object.getOwnPropertySymbols(classObject)) {
    const metadata: unknown = Object.getOwnPropertyDescriptor(classObject, symbol)!.value
    if (typeof metadata !== 'object' || metadata === null) continue
    // Stored attrs, then computed attrs.
    const lists = [standardAttrs, standardComputedAttrs].map(key =>
      hasOwn(metadata, key) ? (metadata as Record<symbol, string[]>)[key]! : []
    )
    if (lists.flat().length) return lists
  }
  return [[], []]
}

// Classes whose attrs are registered, mapped to whether any of them came from standard decorator metadata.
const registeredStandardAttrs = new WeakMap<object, boolean>()

/**
 * Registers the `@attr` members recorded in decorator metadata by standard
 * decorators, so `initializeAttrs` and `defineObservedAttributes` find them.
 *
 * Walks up the class chain to include undecorated base classes, stopping at a
 * class already registered. Reads each class's own metadata because a class
 * without a class decorator may get metadata that doesn't inherit from its
 * parent's.
 */
export function registerStandardAttrs(classObject: CustomElementClass): void {
  if (registeredStandardAttrs.has(classObject)) return
  const levels: CustomElementClass[] = []
  let current: unknown = classObject
  for (
    ;
    typeof current === 'function' && !registeredStandardAttrs.has(current);
    current = Object.getPrototypeOf(current)
  ) {
    levels.unshift(current as CustomElementClass)
  }
  const attrs = meta(classObject.prototype, attrKey)
  const ancestor = registeredStandardAttrs.has(current as object) ? (current as CustomElementClass) : undefined
  const standard = levels.map(ownStandardAttrs)
  const hasStandard = !!standard.flat(2).length || !!registeredStandardAttrs.get(current as object)
  if (hasStandard) {
    // Base class attrs first, matching the order legacy decorators register them in. Read each class's own legacy
    // attrs, because a subclass's copy of them can predate standard attrs registered on its ancestors.
    const ordered = new Set(ancestor ? meta(ancestor.prototype, attrKey) : [])
    for (const [i, level] of levels.entries()) {
      const [stored, computed] = standard[i] as [string[], string[]]
      const proto = level.prototype
      const legacy = [...(level === classObject ? attrs : ownMeta(proto, attrKey) ?? [])]
      // Legacy registrations don't record the member kind, so look for a getter on this class.
      const isComputed = (key: string) => !!Object.getOwnPropertyDescriptor(proto, key)?.get
      for (const key of stored.concat(legacy.filter(name => !isComputed(name)))) ordered.add(key)
      // Getters and setters may read the attrs before them, so they go last, even when they override a base attr.
      for (const key of legacy.filter(isComputed).concat(computed)) {
        ordered.delete(key)
        ordered.add(key)
      }
    }
    attrs.clear()
    for (const key of ordered) attrs.add(key)
  }
  registeredStandardAttrs.set(classObject, hasStandard)
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

// The legacy overload comes last, so `Parameters` reads it and callbacks such as `forEach` still accept the function.
export function defineObservedAttributes<C extends CustomElementClass>(classObject: C, context: ClassContext<C>): void
export function defineObservedAttributes(classObject: CustomElementClass): void
export function defineObservedAttributes(classObject: CustomElementClass, context?: unknown): void {
  // Standard class decorators run before the class's decorator metadata is attached, so wait for it.
  if (isDecoratorContext(context)) {
    return (context as ClassContext<CustomElementClass>).addInitializer(function (this: CustomElementClass) {
      defineObservedAttributes(this)
    })
  }
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
