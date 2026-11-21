import type {CustomElementClass} from './custom-element.js'
import {mustDasherize} from './dasherize.js'
import {meta, ownMeta} from './core.js'
import type {ClassContext, MemberContext} from './decorator-context.js'
import {assertClass, hasOwn, isDecoratorContext, memberName} from './decorator-context.js'

const attrKey = 'attr'
type attrValue = string | number | boolean

const standardAttrs = Symbol.for('catalyst:attr')
// Names of standard `@attr` getters and setters, which compute their value rather than store it.
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
export function attr(proto: unknown, keyOrContext: unknown): void {
  if (!isDecoratorContext(keyOrContext)) {
    meta(proto as Record<PropertyKey, unknown>, attrKey).add(keyOrContext as string)
    return
  }
  const name = memberName('attr', keyOrContext, ['field', 'accessor', 'getter', 'setter'])
  const metadata = keyOrContext.metadata as Record<PropertyKey, string[] | undefined> | undefined
  if (!metadata) throw new TypeError('@attr requires decorator metadata (`Symbol.metadata`) support')
  // Metadata inherits from the parent class's metadata, so only append to this class's own lists. The kind is recorded
  // now, because another decorator may replace the member's getter.
  const record = (list: symbol) => {
    if (hasOwn(metadata, list)) metadata[list]!.push(name)
    else metadata[list] = [name]
  }
  record(standardAttrs)
  if (keyOrContext.kind === 'getter' || keyOrContext.kind === 'setter') record(standardComputedAttrs)
}

/**
 * Returns the `@attr` members recorded in the class's own decorator metadata. Finds the metadata by these lists rather
 * than by `Symbol.metadata`, because another library may redefine `Symbol.metadata` after some classes are defined.
 */
function ownStandardAttrs(classObject: object): Record<symbol, string[] | undefined> {
  for (const symbol of Object.getOwnPropertySymbols(classObject)) {
    const metadata: unknown = Object.getOwnPropertyDescriptor(classObject, symbol)!.value
    if (typeof metadata === 'object' && metadata !== null && hasOwn(metadata, standardAttrs)) {
      return metadata as Record<symbol, string[]>
    }
  }
  return {}
}

// Classes whose attrs are registered, mapped to whether any of them came from standard decorator metadata.
const registeredStandardAttrs = new WeakMap<object, boolean>()
// Standard attrs of a registered class, including inherited ones, mapped to whether they're getters or setters.
const standardAttrKinds = new WeakMap<object, Map<string, boolean>>()

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
  const kinds = new Map(standardAttrKinds.get(current as object))
  const standard = levels.map(level => {
    const metadata = ownStandardAttrs(level)
    const own = metadata[standardAttrs] ?? []
    // Metadata inherits from the parent class's, so ignore a computed list this class doesn't own.
    const computed = (hasOwn(metadata, standardComputedAttrs) && metadata[standardComputedAttrs]) || []
    // A subclass that redefines an inherited standard attr without decorating it, such as a legacy getter, decides
    // its kind from its own definition.
    for (const key of kinds.keys()) if (hasOwn(level.prototype, key) && !own.includes(key)) kinds.delete(key)
    for (const key of own) kinds.set(key, computed.includes(key))
    return own
  })
  const hasStandard = standard.some(level => level.length) || !!registeredStandardAttrs.get(current as object)
  standardAttrKinds.set(classObject, kinds)
  if (hasStandard) {
    // Base class attrs first, matching the order legacy decorators register them in. Within a class, standard attrs
    // come first, because they're recorded when the class is defined and legacy `attr()` calls can only follow. Read
    // each class's own legacy attrs, because a subclass's copy of them can predate standard attrs on its ancestors.
    const ordered = new Set(ancestor ? meta(ancestor.prototype, attrKey) : [])
    for (const [i, level] of levels.entries()) {
      for (const key of standard[i]!) ordered.add(key)
      for (const key of level === classObject ? attrs : ownMeta(level.prototype, attrKey) ?? []) ordered.add(key)
    }
    attrs.clear()
    for (const key of ordered) attrs.add(key)
  }
  registeredStandardAttrs.set(classObject, hasStandard)
}

// Every element dasherizes the same few names, so cache them.
const attrNames = new Map<string, string>()
const attrName = (prefixed: string): string =>
  attrNames.get(prefixed) ?? attrNames.set(prefixed, mustDasherize(prefixed)).get(prefixed)!

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
const nativeCode = /\{\s*\[native code\]\s*\}$/
// Prototypes mapped to whether they belong to a built-in class. Reading a class's source is slow, so do it once.
const nativePrototypes = new WeakMap<object, boolean>()
const isNative = (proto: object): boolean =>
  nativePrototypes.get(proto) ??
  nativePrototypes.set(proto, nativeCode.test(Function.prototype.toString.call(proto.constructor))).get(proto)!
export function initializeAttrs(instance: HTMLElement, names?: Iterable<string>): void {
  if (initialized.has(instance)) return
  initialized.add(instance)
  const proto = Object.getPrototypeOf(instance)
  const prefix = proto?.constructor?.attrPrefix ?? 'data-'
  // Registering also records the kinds of standard attrs, which explicitly named attrs need too.
  if (typeof proto?.constructor === 'function') registerStandardAttrs(proto.constructor)
  if (!names) names = meta(proto, attrKey)
  const nameOf = (key: string) => attrName(`${prefix}${key}`)
  const kinds = standardAttrKinds.get(proto?.constructor)
  // Standard decorators record whether an attr is a getter or setter. For others, look for a getter without a setter
  // on the classes above the built-in element they extend. One with a setter, such as an auto-accessor or a getter and
  // setter pair, stores a value as far as Catalyst can tell, so it keeps registration order, as in v1.8.1. An attr
  // named like a built-in accessor, such as `title`, is a field.
  const isAccessor = (key: string) => {
    if (kinds?.has(key)) return kinds.get(key)
    for (let o = proto; o && !isNative(o); o = Object.getPrototypeOf(o)) {
      const descriptor = Object.getOwnPropertyDescriptor(o, key)
      if (descriptor) return !!descriptor.get && !descriptor.set
    }
    return false
  }
  // A getter attr may read other attrs, so it should see them initialized. Fields read nothing, so they go first, in
  // registration order. They're own properties by now, or have no accessor at all.
  const fields: string[] = []
  const accessors: string[] = []
  for (const key of names) (!hasOwn(instance, key) && isAccessor(key) ? accessors : fields).push(key)
  for (const key of fields) initializeAttr(instance, key, nameOf(key))
  // Getters, setters and accessors follow, those with an HTML attribute first, checked now because field callbacks may
  // add attributes. One without an HTML attribute returns its default before and after it's initialized.
  if (!accessors.length) return
  const has = (key: string) => instance.hasAttribute(nameOf(key))
  for (const key of accessors.filter(has).concat(accessors.filter(other => !has(other)))) {
    initializeAttr(instance, key, nameOf(key))
  }
}

function initializeAttr(instance: HTMLElement, key: string, name: string) {
  const value = (<Record<PropertyKey, unknown>>(<unknown>instance))[key]
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

// The legacy overload comes last, so `Parameters` reads it and callbacks such as `forEach` still accept the function.
export function defineObservedAttributes<C extends CustomElementClass>(classObject: C, context: ClassContext<C>): void
export function defineObservedAttributes(classObject: CustomElementClass): void
export function defineObservedAttributes(classObject: CustomElementClass, context?: unknown): void {
  // Standard class decorators run before the class's decorator metadata is attached, so wait for it.
  if (isDecoratorContext(context)) {
    assertClass('defineObservedAttributes', context)
    ;(context as ClassContext<CustomElementClass>).addInitializer(function (this: CustomElementClass) {
      defineObservedAttributes(this)
    })
    return
  }
  registerStandardAttrs(classObject)
  let observed = classObject.observedAttributes || []

  const prefix = classObject.attrPrefix ?? 'data-'
  const attrToAttributeName = (name: string) => attrName(`${prefix}${name}`)

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
