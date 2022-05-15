import type {CustomElementClass} from './custom-element.js'

type Decorator = (Class: CustomElementClass) => unknown
const abilityMarkers = new WeakMap<CustomElementClass, Set<Decorator>>()
export const createAbility = <TExtend, TClass extends CustomElementClass>(
  decorate: (Class: TClass) => TExtend
): ((Class: TClass) => TExtend) => {
  return (Class: TClass): TExtend => {
    const markers = abilityMarkers.get(Class)
    if (markers?.has(decorate as Decorator)) return Class as unknown as TExtend
    const NewClass = decorate(Class) as TExtend
    const newMarkers = new Set(markers)
    newMarkers.add(decorate as Decorator)
    abilityMarkers.set(NewClass as unknown as CustomElementClass, newMarkers)
    return NewClass
  }
}
