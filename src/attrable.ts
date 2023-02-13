import type {CustomElementClass} from './custom-element.js'
import type {ControllableClass} from './controllable.js'
import {controllable} from './controllable.js'
import {dasherize, mustDasherize} from './dasherize.js'
import {createMark} from './mark.js'
import {createAbility} from './ability.js'

const attrChangedCallback = Symbol()
const serializeAttributeName = Symbol()

export interface Attrable {
  [key: PropertyKey]: unknown
  [serializeAttributeName](name: PropertyKey): string
  [attrChangedCallback](changed: Map<PropertyKey, unknown>): void
}

export interface AttrableClass {
  new (): Attrable
}

export const deprecatedDataPrefixedAttrs = createAbility(
  <T extends CustomElementClass>(Class: T): T =>
    class extends controllable(Class) {
      [serializeAttributeName](name: PropertyKey) {
        return `data-${dasherize(name)}`
      }
    }
)

const Identity = (v: unknown) => v
let setFromMutation = false
const attrs = new WeakMap<Element, Map<string, PropertyKey>>()

const handleMutations = (mutations: MutationRecord[]) => {
  for (const mutation of mutations) {
    if (mutation.type === 'attributes') {
      const name = mutation.attributeName!
      const el = mutation.target as Element & {[key: PropertyKey]: unknown}
      const key = attrs.get(el)?.get(name)
      if (key) {
        setFromMutation = true
        el[key] = el.getAttribute(name)
        setFromMutation = false
      }
    }
  }
}
const observer = new MutationObserver(handleMutations)

const [attr, getAttr, initializeAttrs] = createMark<Element & Attrable>(
  ({name}) => mustDasherize(name, '@attr'),
  (instance: Element & Attrable, {name, kind, access}) => {
    let cast: typeof Identity | typeof Boolean | typeof Number | typeof String = Identity
    let initialValue: unknown
    if (access.get) {
      initialValue = access.get.call(instance)
    } else if ('value' in access && kind !== 'method') {
      initialValue = access.value
    }
    let value = initialValue
    const attributeName = instance[serializeAttributeName](name)
    const setCallback = (kind === 'method' ? access.value : access.set) || Identity
    const getCallback = access.get || (() => value)
    if (!attrs.get(instance)) attrs.set(instance, new Map())
    attrs.get(instance)!.set(attributeName, name)
    if (typeof value === 'number') {
      cast = Number
    } else if (typeof value === 'boolean') {
      cast = Boolean
    } else if (typeof value === 'string') {
      cast = String
    }
    const queue = new Map()
    const requestAttrChanged = async (newValue: unknown) => {
      queue.set(name, newValue)
      if (queue.size > 1) return
      await Promise.resolve()
      const changed = new Map(queue)
      queue.clear()
      instance[attrChangedCallback](changed)
    }
    return {
      get() {
        const has = instance.hasAttribute(attributeName)
        if (has) {
          return cast === Boolean ? has : cast(instance.getAttribute(attributeName))
        }
        return cast(getCallback.call(instance))
      },
      set(newValue: unknown) {
        const isInitial = newValue === null
        if (isInitial) newValue = initialValue
        const same = Object.is(value, newValue)
        value = newValue
        setCallback.call(instance, value)
        if (setFromMutation || same || isInitial) return
        requestAttrChanged(newValue)
      }
    }
  }
)

export {attr, getAttr, attrChangedCallback}
export const attrable = createAbility(
  <T extends CustomElementClass>(Class: T): T & ControllableClass & AttrableClass =>
    class extends controllable(Class) {
      [key: PropertyKey]: unknown
      constructor() {
        super()
        initializeAttrs(this)
        const attributeFilter = Array.from(getAttr(this)).map(name => this[serializeAttributeName](name))
        observer.observe(this, {attributeFilter})
      }

      [serializeAttributeName](name: PropertyKey) {
        return dasherize(name)
      }

      [attrChangedCallback](changed: Map<PropertyKey, unknown>) {
        if (!this.isConnected) return
        for (const [name, value] of changed) {
          if (typeof value === 'boolean') {
            this.toggleAttribute(this[serializeAttributeName](name), value)
          } else {
            this.setAttribute(this[serializeAttributeName](name), String(value))
          }
        }
      }
    }
)
