import type {CustomElementClass, CustomElement} from './custom-element.js'
import {createMark} from './mark.js'
import {createAbility} from './ability.js'

export interface Context<T> {
  name: PropertyKey
  initialValue?: T
}
export type ContextCallback<ValueType> = (value: ValueType, dispose?: () => void) => void
export type ContextType<T extends Context<unknown>> = T extends Context<infer Y> ? Y : never

export class ContextEvent<T extends Context<unknown>> extends Event {
  public constructor(
    public readonly context: T,
    public readonly callback: ContextCallback<ContextType<T>>,
    public readonly multiple?: boolean
  ) {
    super('context-request', {bubbles: true, composed: true})
  }
}

function isContextEvent(event: unknown): event is ContextEvent<Context<unknown>> {
  return (
    event instanceof Event &&
    event.type === 'context-request' &&
    'context' in event &&
    'callback' in event &&
    'multiple' in event
  )
}

const contexts = new WeakMap<CustomElement, Map<PropertyKey, Set<(value: unknown) => void>>>()
const [provide, getProvide, initProvide] = createMark<CustomElement>(
  ({name, kind}) => {
    if (kind === 'setter') throw new Error(`@provide cannot decorate setter ${String(name)}`)
    if (kind === 'method') throw new Error(`@provide cannot decorate method ${String(name)}`)
  },
  (instance: CustomElement, {name, kind, access}) => {
    return {
      get: () => (kind === 'getter' ? access.get!.call(instance) : access.value),
      set: (newValue: unknown) => {
        access.set?.call(instance, newValue)
        for (const callback of contexts.get(instance)?.get(name) || []) callback(newValue)
      }
    }
  }
)
const [provideAsync, getProvideAsync, initProvideAsync] = createMark<CustomElement>(
  ({name, kind}) => {
    if (kind === 'setter') throw new Error(`@provide cannot decorate setter ${String(name)}`)
    if (kind === 'method') throw new Error(`@provide cannot decorate method ${String(name)}`)
  },
  (instance: CustomElement, {name, kind, access}) => {
    return {
      get: () => (kind === 'getter' ? access.get!.call(instance) : access.value),
      set: (newValue: unknown) => {
        access.set?.call(instance, newValue)
        for (const callback of contexts.get(instance)?.get(name) || []) callback(newValue)
      }
    }
  }
)
const [consume, getConsume, initConsume] = createMark<CustomElement>(
  ({name, kind}) => {
    if (kind === 'method') throw new Error(`@consume cannot decorate method ${String(name)}`)
  },
  (instance: CustomElement, {name, access}) => {
    const initialValue: unknown = access.get?.call(instance) ?? access.value
    let currentValue = initialValue
    instance.dispatchEvent(
      new ContextEvent(
        {name, initialValue},
        (value: unknown, dispose?: () => void) => {
          if (!disposes.has(instance)) disposes.set(instance, new Map())
          const instanceDisposes = disposes.get(instance)!
          if (instanceDisposes.has(name)) {
            const oldDispose = instanceDisposes.get(name)!
            if (oldDispose !== dispose) oldDispose()
          }
          if (dispose) instanceDisposes.set(name, dispose)
          currentValue = value
          access.set?.call(instance, currentValue)
        },
        true
      )
    )
    return {get: () => currentValue}
  }
)

const disposes = new WeakMap<CustomElement, Map<PropertyKey, () => void>>()

export {consume, provide, provideAsync, getProvide, getProvideAsync, getConsume}
export const providable = createAbility(
  <T extends CustomElementClass>(Class: T): T =>
    class extends Class {
      [key: PropertyKey]: unknown

      // TS mandates Constructors that get mixins have `...args: any[]`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
        super(...args)
        initProvide(this)
        initProvideAsync(this)
        const provides = getProvide(this)
        const providesAsync = getProvideAsync(this)
        if (provides.size || providesAsync.size) {
          if (!contexts.has(this)) contexts.set(this, new Map())
          const instanceContexts = contexts.get(this)!
          this.addEventListener('context-request', event => {
            if (!isContextEvent(event)) return
            const name = event.context.name
            if (!provides.has(name) && !providesAsync.has(name)) return
            const value = this[name]
            const dispose = () => instanceContexts.get(name)?.delete(callback)
            const eventCallback = event.callback
            let callback = (newValue: unknown) => eventCallback(newValue, dispose)
            if (providesAsync.has(name)) {
              callback = async (newValue: unknown) => eventCallback(await newValue, dispose)
            }
            if (event.multiple) {
              if (!instanceContexts.has(name)) instanceContexts.set(name, new Set())
              instanceContexts.get(name)!.add(callback)
            }
            event.stopPropagation()
            callback(value)
          })
        }
      }

      connectedCallback() {
        initConsume(this)
        super.connectedCallback?.()
      }

      disconnectedCallback() {
        for (const dispose of disposes.get(this)?.values() || []) {
          dispose()
        }
      }
    }
)
