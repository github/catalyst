import type {CustomElement} from './custom-element.js'

export interface Ability extends CustomElement {
  [attachShadowCallback]?(shadowRoot: ShadowRoot): void
  [attachInternalsCallback]?(internals: ElementInternals): void
}

export interface AbilityClass {
  new (): Ability
  observedAttributes?: string[]
  formAssociated?: boolean
}

export const attachShadowCallback = Symbol()
export const attachInternalsCallback = Symbol()

type Decorator = (Class: AbilityClass) => AbilityClass
const abilityMarkers = new WeakMap<AbilityClass, Set<Decorator>>()
export const createAbility = (decorate: Decorator) => {
  return (Class: AbilityClass): AbilityClass => {
    if (!abilityMarkers.has(Class)) Class = abilitable(Class)
    const markers = abilityMarkers.get(Class)
    if (markers?.has(decorate)) return Class
    const NewClass = decorate(Class as AbilityClass)
    const newMarkers = new Set(markers)
    newMarkers.add(decorate)
    abilityMarkers.set(NewClass, newMarkers)
    return NewClass
  }
}

const shadows = new WeakMap<Ability, ShadowRoot | undefined>()
const internals = new WeakMap<Ability, ElementInternals>()
const internalsCalled = new WeakSet()
const abilitable = (Class: AbilityClass): AbilityClass =>
  class extends Class {
    constructor() {
      super()
      const shadowRoot = this.shadowRoot
      if (shadowRoot && shadowRoot !== shadows.get(this)) this[attachShadowCallback](shadowRoot)
      if (!internalsCalled.has(this)) {
        try {
          this.attachInternals()
        } catch {
          // Ignore errors
        }
      }
    }

    connectedCallback() {
      super.connectedCallback?.()
      this.setAttribute('data-catalyst', '')
    }

    attachShadow(...args: [init: ShadowRootInit]): ShadowRoot {
      const shadowRoot = super.attachShadow(...args)
      this[attachShadowCallback](shadowRoot)
      return shadowRoot
    }

    [attachShadowCallback](shadowRoot: ShadowRoot) {
      shadows.set(this, shadowRoot)
    }

    attachInternals(): ElementInternals {
      if (internals.has(this) && !internalsCalled.has(this)) {
        internalsCalled.add(this)
        return internals.get(this)!
      }
      const elementInternals = super.attachInternals()
      this[attachInternalsCallback](elementInternals)
      internals.set(this, elementInternals)
      return elementInternals
    }

    [attachInternalsCallback](elementInternals: ElementInternals) {
      const shadowRoot = elementInternals.shadowRoot
      if (shadowRoot && shadowRoot !== shadows.get(this)) {
        this[attachShadowCallback](shadowRoot)
      }
    }
  }
