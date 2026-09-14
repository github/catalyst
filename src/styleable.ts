import type {CustomElementClass, CustomElement} from './custom-element.js'
import {controllable, attachShadowCallback} from './controllable.js'
import {createMark} from './mark.js'
import {createAbility} from './ability.js'

const [style, getStyle, initStyle] = createMark<CustomElement>(
  ({name, kind}) => {
    if (kind === 'setter') throw new Error(`@style cannot decorate setter ${String(name)}`)
    if (kind === 'method') throw new Error(`@style cannot decorate method ${String(name)}`)
  },
  (instance: CustomElement, {name, kind, access}) => {
    return {
      get: () => (kind === 'getter' ? access.get!.call(instance) : access.value),
      set: () => {
        throw new Error(`Cannot set @style ${String(name)}`)
      }
    }
  }
)

export {style, getStyle}
export const stylable = createAbility(
  <T extends CustomElementClass>(Class: T): T =>
    class extends controllable(Class) {
      [key: PropertyKey]: unknown

      // TS mandates Constructors that get mixins have `...args: any[]`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
        super(...args)
        initStyle(this)
      }

      [attachShadowCallback](root: ShadowRoot) {
        super[attachShadowCallback]?.(root)
        const styleProps = getStyle(this)
        if (!styleProps.size) return
        const styles = new Set([...root.adoptedStyleSheets])
        for (const name of styleProps) styles.add(this[name] as CSSStyleSheet)
        root.adoptedStyleSheets = [...styles]
      }
    }
)
