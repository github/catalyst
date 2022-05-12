type PropertyType = 'field' | 'getter' | 'setter' | 'method'
interface PropertyDecorator {
  (proto: object, key: PropertyKey, descriptor?: PropertyDescriptor): void
  readonly static: unique symbol
}
type GetMarks = (instance: object) => Set<PropertyKey>
export function createMark(validate: (key: PropertyKey, type: PropertyType) => void): [PropertyDecorator, GetMarks] {
  const marks = new WeakMap<object, Set<PropertyKey>>()
  function get(proto: object): Set<PropertyKey> {
    if (!marks.has(proto)) {
      const parent = Object.getPrototypeOf(proto)
      marks.set(proto, new Set(marks.get(parent) || []))
    }
    return marks.get(proto)!
  }
  const marker = (proto: object, key: PropertyKey, descriptor?: PropertyDescriptor): void => {
    if (get(proto).has(key)) return
    let type: PropertyType = 'field'
    if (descriptor) {
      if (typeof descriptor.value === 'function') type = 'method'
      if (typeof descriptor.get === 'function') type = 'getter'
      if (typeof descriptor.set === 'function') type = 'setter'
    }
    validate(key, type)
    get(proto).add(key)
  }
  marker.static = Symbol()

  return [
    marker as PropertyDecorator,
    (instance: object): Set<PropertyKey> => {
      const proto = Object.getPrototypeOf(instance)
      for (const key of proto.constructor[marker.static] || []) {
        marker(proto, key, Object.getOwnPropertyDescriptor(proto, key))
      }
      return new Set(get(proto))
    }
  ]
}
