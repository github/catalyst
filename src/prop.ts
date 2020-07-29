/**
 * Prop is a decorator which - when assigned to a property field on the class
 * - will add the field name to the `observedProperties` array.
 * `observeProperties()` can use the `observedProperties` array to add
 * observability hooks to all properties. In this way, adding `@prop` to a
 * field is the equivalent of making it observable.
 */
export function prop<K extends string>(proto: Record<K, unknown>, key: K): void {
  const {constructor} = proto
  let observed = [key]
  if ('observedProperties' in constructor) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    observed = (constructor as any).observedProperties!.concat(key)
  }
  Object.defineProperty(constructor, 'observedProperties', {
    configurable: true,
    writable: true,
    enumerable: true,
    value: observed
  })
}
