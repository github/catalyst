type Parse = (str: string) => string[]
type Found = (el: Element, controller: Element | ShadowRoot, tag: string, ...parsed: string[]) => void

function closestShadowPiercing(el: Element, tagName: string): Element | null {
  const closest: Element | null = el.closest(tagName)
  if (!closest) {
    const shadow = el.getRootNode()
    if (!(shadow instanceof ShadowRoot)) return null
    return shadow.host.closest(tagName)
  }
  return closest
}

export const parseElementTags = (el: Element, tag: string, parse: Parse) =>
  (el.getAttribute(tag) || '')
    .trim()
    .split(/\s+/g)
    .map((tagPart: string) => parse(tagPart))

const registry = new Map<string, [Parse, Found]>()
const observer = new MutationObserver((mutations: MutationRecord[]) => {
  for (const mutation of mutations) {
    if (mutation.type === 'attributes') {
      const tag = mutation.attributeName!
      const el = mutation.target

      if (el instanceof Element && registry.has(tag)) {
        const [parse, found] = registry.get(tag)!
        for (const [tagName, ...meta] of parseElementTags(el, tag, parse)) {
          const controller = closestShadowPiercing(el, tagName)
          if (controller) found(el, controller, tag, ...meta)
        }
      }
    } else if (mutation.addedNodes.length) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element) observeElementForTags(node)
      }
    }
  }
})

export const registerTag = (tag: string, parse: Parse, found: Found) => {
  if (registry.has(tag)) throw new Error('duplicate tag')
  registry.set(tag, [parse, found])
}

export const observeElementForTags = (root: Element | ShadowRoot) => {
  for (const [tag, [parse, found]] of registry) {
    for (const el of root.querySelectorAll(`[${tag}]`)) {
      for (const [tagName, ...meta] of parseElementTags(el, tag, parse)) {
        const controller = closestShadowPiercing(el, tagName)
        if (controller) found(el, controller, tag, ...meta)
      }
    }
    if (root instanceof Element && root.hasAttribute(tag)) {
      for (const [tagName, ...meta] of parseElementTags(root, tag, parse)) {
        const controller = closestShadowPiercing(root, tagName)
        if (controller) found(root, controller, tag, ...meta)
      }
    }
  }
  observer.observe(root instanceof Element ? root.ownerDocument : root, {
    childList: true,
    subtree: true,
    attributeFilter: Array.from(registry.keys())
  })
}
