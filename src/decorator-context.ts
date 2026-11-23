/**
 * The parts of standard (TC39) decorator contexts that Catalyst uses. Declared structurally rather than using
 * TypeScript's `ClassDecoratorContext` and friends so the published types still load in TypeScript versions before
 * 5.0, which lack them.
 */
export interface ClassContext<C = unknown> {
  readonly kind: 'class'
  readonly name: string | undefined
  readonly metadata?: object | undefined
  addInitializer(initializer: (this: C) => void): void
}

// Catalyst's member decorators only support public instance members with string names. TypeScript passes literal
// `static` and `private` types, so other members fail to type-check.
export interface MemberContext<Kind extends string = string, This = unknown, Value = unknown> {
  readonly kind: Kind
  readonly name: string
  readonly static: false
  readonly private: false
  readonly metadata?: object | undefined
  readonly access: {get?(object: This): Value; set?(object: This, value: Value): void}
  addInitializer(initializer: (this: This) => void): void
}

export interface AccessorTarget<This, Value> {
  get(this: This): Value
  set(this: This, value: Value): void
}

export interface AccessorResult<This, Value> {
  get?(this: This): Value
  set?(this: This, value: Value): void
  init?(this: This, value: Value): Value
}

// Lets compilers that only attach decorator metadata when `Symbol.metadata` exists (such as TypeScript) do so. Uses
// the same fallback key as the SWC and Babel helpers, and leaves an existing definition alone.
try {
  ;(Symbol as {metadata?: symbol}).metadata ??= Symbol.for('Symbol.metadata')
} catch {
  // `Symbol` is frozen, for example by SES `lockdown()`. Legacy decorators don't need metadata.
}

export const hasOwn = (object: object, key: PropertyKey): boolean => Object.prototype.hasOwnProperty.call(object, key)

// The `@attr` members a class records in its decorator metadata.
export const standardAttrs = Symbol.for('catalyst:attr')

/**
 * Returns the class's own decorator metadata, if it records `@attr` members. Finds the metadata by those rather than by
 * `Symbol.metadata`, because another library may redefine `Symbol.metadata` after some classes are defined.
 */
export function ownMetadata(classObject: object): Record<symbol, string[] | undefined> | undefined {
  for (const symbol of Object.getOwnPropertySymbols(classObject)) {
    const metadata: unknown = Object.getOwnPropertyDescriptor(classObject, symbol)!.value
    if (typeof metadata === 'object' && metadata !== null && hasOwn(metadata, standardAttrs)) {
      return metadata as Record<symbol, string[]>
    }
  }
}

// Metadata of classes that a class decorator received. A class decorator can return a class it defines, and
// TypeScript then replaces that class's metadata with the metadata of the class it decorated.
export const receivedMetadata = new WeakMap<object, object>()

// Classes that an outer class decorator returned, mapped to the name of the class a Catalyst decorator received.
export const receivedNames = new WeakMap<object, string>()

// Records the name of the class a standard class decorator received for the class its initializer runs on.
export function nameAs(final: {name: string}, received: {name: string}): void {
  if (final !== received) receivedNames.set(final, received.name)
}

export function receiveClass(decorator: string, context: ClassContext | MemberContext, classObject: object): void {
  assertClass(decorator, context)
  const metadata = ownMetadata(classObject)
  if (metadata) receivedMetadata.set(classObject, metadata)
}

// Standard decorators receive a context object as their second argument; legacy decorators receive the member name.
export function isDecoratorContext(value: unknown): value is ClassContext | MemberContext {
  return typeof value === 'object' && value !== null && 'kind' in value && 'addInitializer' in value
}

export function assertClass(decorator: string, context: ClassContext | MemberContext): void {
  if (context.kind !== 'class') throw new TypeError(`@${decorator} must decorate a class`)
}

export function memberName(decorator: string, context: ClassContext | MemberContext, kinds: string[]): string {
  // `kinds` never includes 'class', so class contexts fail the first check.
  const member = context as MemberContext
  if (!kinds.includes(member.kind) || member.static || member.private || typeof member.name !== 'string') {
    throw new TypeError(`@${decorator} must decorate a public instance ${kinds.join('/')}`)
  }
  return member.name
}
