export const getMethods = (obj: any) => {
  let methods = []
  for (const name of Object.getOwnPropertyNames(obj)) {
    if (name === 'constructor') continue
    const descriptor = Object.getOwnPropertyDescriptor(obj, name)
    if (descriptor && descriptor.value && typeof descriptor.value === 'function') {
      methods.push(name)
    }
  }
  return methods
}
