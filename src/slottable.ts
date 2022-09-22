import type {CustomElementClass} from './custom-element.js'
import {controllable, attachShadowCallback} from './controllable.js'
import {createMark} from './mark.js'
import {createAbility} from './ability.js'
import {dasherize} from './dasherize.js'

export const mainSlot = Symbol()

const getSlotEl = (root?: ShadowRoot, key?: PropertyKey) =>
  root?.querySelector<HTMLSlotElement>(`slot${key === mainSlot ? `:not([name])` : `[name=${dasherize(key)}]`}`) ?? null

const [slot, getSlot, initSlot] = createMark<Element>(
  ({name, kind}) => {
    if (kind === 'getter') throw new Error(`@slot cannot decorate get ${String(name)}`)
    if (kind === 'method') throw new Error(`@slot cannot decorate method ${String(name)}`)
  },
  (instance: Element, {name, access}) => {
    return {
      get: () => applySlot(instance, name),
      set: () => {
        access.set?.call(instance, getSlotEl(shadows.get(instance), name))
      }
    }
  }
)

const slotObserver = new MutationObserver(mutations => {
  const seen = new WeakSet()
  for (const mutation of mutations) {
    const el = mutation.target
    const controller = (el.getRootNode() as ShadowRoot).host
    if (seen.has(controller)) continue
    seen.add(controller)
    let slotHasChanged = el instanceof HTMLSlotElement
    if (!slotHasChanged && mutation.addedNodes) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLSlotElement) {
          slotHasChanged = true
          break
        }
      }
    }
    if (slotHasChanged) for (const key of getSlot(controller)) applySlot(controller, key)
  }
})
const slotObserverOptions = {childList: true, subtree: true, attributeFilter: ['name']}

const listened = new WeakSet<HTMLSlotElement>()
const oldValues = new WeakMap<Element, Map<PropertyKey, HTMLSlotElement | null>>()
function applySlot(controller: Element, key: PropertyKey) {
  if (!oldValues.has(controller)) oldValues.set(controller, new Map())
  if (!slotNameMap.has(controller)) slotNameMap.set(controller, new WeakMap())
  const oldSlot = oldValues.get(controller)!.get(key)
  const newSlot = getSlotEl(shadows.get(controller), key)
  oldValues.get(controller)!.set(key, newSlot)
  if (newSlot && !listened.has(newSlot)) {
    slotNameMap.get(controller)!.set(newSlot, key)
    newSlot.addEventListener('slotchange', handleSlotChange)
    listened.add(newSlot)
  }
  if (oldSlot !== newSlot) (controller as unknown as Record<PropertyKey, HTMLSlotElement | null>)[key] = newSlot
  return newSlot
}

function handleSlotChange(event: Event) {
  const slotEl = event.target
  if (!(slotEl instanceof HTMLSlotElement)) return
  const controller = (slotEl.getRootNode() as ShadowRoot).host
  const key = slotNameMap.get(controller)?.get(slotEl)
  if (key) (controller as unknown as Record<PropertyKey, HTMLSlotElement>)[key] = slotEl
}

export {slot, getSlot}
const shadows = new WeakMap<Element, ShadowRoot>()
const slotNameMap = new WeakMap<Element, WeakMap<HTMLSlotElement, PropertyKey>>()
export const slottable = createAbility(
  <T extends CustomElementClass>(Class: T): T =>
    class extends controllable(Class) {
      // TS mandates Constructors that get mixins have `...args: any[]`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
        super(...args)
        initSlot(this)
      }

      [attachShadowCallback](shadowRoot: ShadowRoot) {
        super[attachShadowCallback]?.(shadowRoot)
        shadows.set(this, shadowRoot)
        slotObserver.observe(shadowRoot, slotObserverOptions)
      }
    }
)
