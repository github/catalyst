/**
 * The parts of standard (TC39) decorator contexts that Catalyst uses. Declared structurally rather than using
 * TypeScript's `ClassDecoratorContext` and friends so the published types still load in TypeScript versions before
 * 5.0, which lack them.
 */
export interface ClassContext<C = unknown> {
  readonly kind: 'class'
  readonly name: string | undefined
  readonly metadata?: object
  addInitializer(initializer: (this: C) => void): void
}

// Catalyst's member decorators only support public instance members with string names. TypeScript passes literal
// `static` and `private` types, so other members fail to type-check.
export interface MemberContext<Kind extends string = string, This = unknown, Value = unknown> {
  readonly kind: Kind
  readonly name: string
  readonly static: false
  readonly private: false
  readonly metadata?: object
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
;(Symbol as {metadata?: symbol}).metadata ??= Symbol.for('Symbol.metadata')

export const hasOwn = (object: object, key: PropertyKey): boolean => Object.prototype.hasOwnProperty.call(object, key)

/**
 * Returns the decorator metadata of the class itself, ignoring metadata it inherits from its parent class.
 */
export function ownMetadata(classObject: object): Record<PropertyKey, unknown> | undefined {
  // Look the key up on every call, like the SWC and Babel helpers: another library may define `Symbol.metadata`
  // after this module loads.
  const key = (Symbol as {metadata?: symbol}).metadata ?? Symbol.for('Symbol.metadata')
  if (hasOwn(classObject, key)) return (classObject as Record<symbol, Record<PropertyKey, unknown>>)[key]
}

// Standard decorators receive a context object as their second argument; legacy decorators receive the member name.
export function isDecoratorContext(value: unknown): value is ClassContext | MemberContext {
  return typeof value === 'object' && value !== null && 'kind' in value && 'addInitializer' in value
}

export function memberName(decorator: string, context: ClassContext | MemberContext, kinds: string[]): string {
  // `kinds` never includes 'class', so class contexts fail the first check.
  const member = context as MemberContext
  if (!kinds.includes(member.kind) || member.static || member.private || typeof member.name !== 'string') {
    throw new TypeError(`@${decorator} must decorate a public instance ${kinds.join('/')}`)
  }
  return member.name
}
