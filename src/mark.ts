import {getPropertyDescriptor} from './get-property-descriptor.js'

type PropertyType = 'field' | 'getter' | 'setter' | 'method'
export interface PropertyDecorator {
  (proto: object, key: PropertyKey, descriptor?: PropertyDescriptor): void
  readonly static: unique symbol
}
type GetMarks<T> = (instance: T) => Set<PropertyKey>
type InitializeMarks<T> = (instance: T) => void

type Context = {
  kind: PropertyType
  name: PropertyKey
  access: PropertyDescriptor
}

const getType = (descriptor?: PropertyDescriptor): PropertyType => {
  if (descriptor) {
    if (typeof descriptor.value === 'function') return 'method'
    if (typeof descriptor.get === 'function') return 'getter'
    if (typeof descriptor.set === 'function') return 'setter'
  }
  return 'field'
}

export function createMark<T extends object>(
  validate: (context: {name: PropertyKey; kind: PropertyType}) => void,
  initialize: (instance: T, context: Context) => PropertyDescriptor | void
): [PropertyDecorator, GetMarks<T>, InitializeMarks<T>] {
  const marks = new WeakMap<object, Set<PropertyKey>>()
  const get = (proto: object): Set<PropertyKey> => {
    if (!marks.has(proto)) {
      const parent = Object.getPrototypeOf(proto)
      marks.set(proto, new Set(parent ? get(parent) || [] : []))
    }
    return marks.get(proto)!
  }
  const marker = (proto: object, name: PropertyKey, descriptor?: PropertyDescriptor): void => {
    if (get(proto).has(name)) return
    validate({name, kind: getType(descriptor)})
    get(proto).add(name)
  }
  marker.static = Symbol()
  const getMarks = (instance: T): Set<PropertyKey> => {
    const proto = Object.getPrototypeOf(instance)
    for (const key of proto.constructor[marker.static] || []) {
      marker(proto, key, Object.getOwnPropertyDescriptor(proto, key))
    }
    return new Set(get(proto))
  }
  return [
    marker as PropertyDecorator,
    getMarks,
    (instance: T): void => {
      for (const name of getMarks(instance)) {
        const access: PropertyDescriptor = getPropertyDescriptor(instance, name) || {
          value: void 0,
          configurable: true,
          writable: true,
          enumerable: true
        }
        const newDescriptor = initialize(instance, {name, kind: getType(access), access}) || access
        Object.defineProperty(instance, name, Object.assign({configurable: true, enumerable: true}, newDescriptor))
      }
    }
  ]
}
