import type {CustomElementClass} from './custom-element.js'
import type {ControllableClass} from './controllable.js'
import {registerTag, observeElementForTags} from './tag-observer.js'
import {createMark} from './mark.js'
import {controllable, attachShadowCallback} from './controllable.js'
import {dasherize} from './dasherize.js'
import {createAbility} from './ability.js'

export interface Targetable {
  [targetChangedCallback](key: PropertyKey, target: Element): void
  [targetsChangedCallback](key: PropertyKey, targets: Element[]): void
}
export interface TargetableClass {
  new (): Targetable
}

const targetChangedCallback = Symbol()
const targetsChangedCallback = Symbol()

const [target, getTarget, initializeTarget] = createMark<Element>(
  ({name, kind}) => {
    if (kind === 'getter') throw new Error(`@target cannot decorate get ${String(name)}`)
  },
  (instance: Element, {name, access}) => {
    const selector = [
      `[data-target~="${instance.tagName.toLowerCase()}.${dasherize(name)}"]`,
      `[data-target~="${instance.tagName.toLowerCase()}.${String(name)}"]`
    ]
    const find = findTarget(instance, selector.join(', '), false)
    return {
      get: find,
      set: () => {
        if (access?.set) access.set.call(instance, find())
      }
    }
  }
)
const [targets, getTargets, initializeTargets] = createMark<Element>(
  ({name, kind}) => {
    if (kind === 'getter') throw new Error(`@target cannot decorate get ${String(name)}`)
  },
  (instance: Element, {name, access}) => {
    const selector = [
      `[data-targets~="${instance.tagName.toLowerCase()}.${dasherize(name)}"]`,
      `[data-targets~="${instance.tagName.toLowerCase()}.${String(name)}"]`
    ]
    const find = findTarget(instance, selector.join(', '), true)
    return {
      get: find,
      set: () => {
        if (access?.set) access.set.call(instance, find())
      }
    }
  }
)

function setTarget(el: Element, controller: Element | ShadowRoot, tag: string, key: string): void {
  const get = tag === 'data-targets' ? getTargets : getTarget
  if (controller instanceof ShadowRoot) controller = controller.host

  if (controller && get(controller)?.has(key)) {
    ;(controller as unknown as Record<PropertyKey, unknown>)[key] = {}
  }
}

registerTag('data-target', (str: string) => str.split('.'), setTarget)
registerTag('data-targets', (str: string) => str.split('.'), setTarget)
const shadows = new WeakMap<Element, ShadowRoot>()

const findTarget = (controller: Element, selector: string, many: boolean) => () => {
  const nodes = []
  const shadow = shadows.get(controller)
  if (shadow) {
    for (const el of shadow.querySelectorAll(selector)) {
      if (!el.closest(controller.tagName)) {
        nodes.push(el)
        if (!many) break
      }
    }
  }
  if (many || !nodes.length) {
    for (const el of controller.querySelectorAll(selector)) {
      if (el.closest(controller.tagName) === controller) {
        nodes.push(el)
        if (!many) break
      }
    }
  }
  return many ? nodes : nodes[0]
}

export {target, getTarget, targets, getTargets, targetChangedCallback, targetsChangedCallback}
export const targetable = createAbility(
  <T extends CustomElementClass>(Class: T): T & ControllableClass & TargetableClass =>
    class extends controllable(Class) {
      constructor() {
        super()
        observeElementForTags(this)
        initializeTarget(this)
        initializeTargets(this)
      }

      [targetChangedCallback]() {
        return
      }

      [targetsChangedCallback]() {
        return
      }

      [attachShadowCallback](root: ShadowRoot) {
        super[attachShadowCallback]?.(root)
        shadows.set(this, root)
        observeElementForTags(root)
      }
    }
)
