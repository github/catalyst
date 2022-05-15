export const getPropertyDescriptor = (instance: unknown, key: PropertyKey): PropertyDescriptor | undefined => {
  while (instance) {
    const descriptor = Object.getOwnPropertyDescriptor(instance, key)
    if (descriptor) return descriptor
    instance = Object.getPrototypeOf(instance)
  }
}
