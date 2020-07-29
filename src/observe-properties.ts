export const observed = Symbol()

interface ClassLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): any
  observedProperties?: string[]
}

export function observeProperties<T extends ClassLike>(classObject: T): ClassLike {
  const observedProperties = 'observedProperties' in classObject ? classObject.observedProperties : []
  const Class = class extends classObject {
    [observed] = {}
    static observedProperties = observedProperties
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args)
      for (const name of new Set(classObject.observedProperties)) {
        const protoDescriptor = Object.getOwnPropertyDescriptor(classObject.prototype, name)
        if (Object.hasOwnProperty.call(this, name)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(this as any)[observed][name] = this[name]
        }
        Object.defineProperty(this, name, {
          configurable: true,
          get() {
            if (protoDescriptor && protoDescriptor.get) {
              this[observed][name] = protoDescriptor.get.call(this)
            }
            return this[observed][name]
          },
          set(newValue: unknown) {
            const oldValue = this[name]
            if (protoDescriptor && protoDescriptor.set) {
              protoDescriptor.set.call(this, newValue)
              if (protoDescriptor.get) {
                newValue = protoDescriptor.get.call(this)
              }
            }
            this[observed][name] = newValue
            if (this.propertyChangedCallback && !Object.is(oldValue, newValue)) {
              this.propertyChangedCallback(name, oldValue, newValue)
            }
          }
        })
      }
    }
  }
  Object.defineProperty(Class, 'name', {value: classObject.name})
  return Class
}
