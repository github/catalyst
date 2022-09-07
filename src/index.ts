export {controller} from './controller.js'

export {register} from './register.js'
export {registerTag, observeElementForTags, parseElementTags} from './tag-observer.js'
export {createMark} from './mark.js'
export {dasherize, mustDasherize} from './dasherize.js'

export {actionable} from './actionable.js'
export {
  target,
  getTarget,
  targets,
  getTargets,
  targetChangedCallback,
  targetsChangedCallback,
  targetable
} from './targetable.js'
export {attr, getAttr, attrable, attrChangedCallback, deprecatedDataPrefixedAttrs} from './attrable.js'
export {lazyDefine} from './lazy-define.js'

export type {CustomElement, CustomElementClass} from './custom-element.js'
