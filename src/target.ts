import {findTarget, findTargets} from './findtarget.js'
import {meta} from './core.js'
import type {AccessorResult, AccessorTarget, MemberContext} from './decorator-context.js'
import {isDecoratorContext, memberName} from './decorator-context.js'

/**
 * Target is a decorator which - when assigned to a property field on the
 * class - will override that class field, turning it into a Getter which
 * returns a call to `findTarget(this, key)` where `key` is the name of the
 * property field. In other words, `@target foo` becomes a getter for
 * `findTarget(this, 'foo')`.
 *
 * With standard decorators it must decorate an accessor:
 * `@target accessor foo!: HTMLElement`.
 */
export function target<This extends HTMLElement, Value>(
  value: AccessorTarget<This, Value>,
  context: MemberContext<'accessor', This, Value>
): AccessorResult<This, Value>
export function target<K extends string>(proto: Record<K, unknown>, key: K): void
export function target(proto: unknown, keyOrContext: unknown): unknown {
  if (isDecoratorContext(keyOrContext)) return standardTarget('target', keyOrContext, findTarget)
  const key = keyOrContext as string
  meta(proto as Record<PropertyKey, unknown>, 'target').add(key)
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      return findTarget(this, key)
    }
  })
}

/**
 * Targets is a decorator which - when assigned to a property field on the
 * class - will override that class field, turning it into a Getter which
 * returns a call to `findTargets(this, key)` where `key` is the name of the
 * property field. In other words, `@targets foo` becomes a getter for
 * `findTargets(this, 'foo')`.
 *
 * With standard decorators it must decorate an accessor:
 * `@targets accessor foos!: HTMLElement[]`.
 */
export function targets<This extends HTMLElement, Value>(
  value: AccessorTarget<This, Value>,
  context: MemberContext<'accessor', This, Value>
): AccessorResult<This, Value>
export function targets<K extends string>(proto: Record<K, unknown>, key: K): void
export function targets(proto: unknown, keyOrContext: unknown): unknown {
  if (isDecoratorContext(keyOrContext)) return standardTarget('targets', keyOrContext, findTargets)
  const key = keyOrContext as string
  meta(proto as Record<PropertyKey, unknown>, 'targets').add(key)
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      return findTargets(this, key)
    }
  })
}

function standardTarget(
  decorator: string,
  context: Parameters<typeof memberName>[1],
  find: (controller: HTMLElement, name: string) => unknown
) {
  const key = memberName(decorator, context, ['accessor'])
  return {
    get(this: HTMLElement) {
      return find(this, key)
    },
    // Legacy decorators define a getter-only property, so assigning to it throws.
    set() {
      throw new TypeError(`Cannot set @${decorator} ${key}`)
    }
  }
}
