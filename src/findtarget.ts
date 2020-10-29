/**
 * findTarget will run `querySelectorAll` against the given controller, plus
 * its shadowRoot, returning any the first child that:
 *
 *  - Matches the selector of `[data-target~="tag.name"]` where tag is the
 *  tagName of the given HTMLElement, and `name` is the given `name` argument.
 *
 *  - Closest ascendant of the element, that matches the tagname of the
 *  controller, is the specific instance of the controller itself - in other
 *  words it is not nested in other controllers of the same type.
 *
 */
export function findTarget(controller: HTMLElement, name: string): Element | undefined {
  const tag = controller.tagName.toLowerCase()
  if (controller.shadowRoot) {
    for (const el of controller.shadowRoot.querySelectorAll(`[data-target~="${tag}.${name}"]`)) {
      if (!el.closest(tag)) return el
    }
  }
  for (const el of controller.querySelectorAll(`[data-target~="${tag}.${name}"]`)) {
    if (el.closest(tag) === controller) return el
  }
}

export function findTargets(controller: HTMLElement, name: string): Element[] {
  const tag = controller.tagName.toLowerCase()
  const targets = []
  if (controller.shadowRoot) {
    for (const el of controller.shadowRoot.querySelectorAll(`[data-targets~="${tag}.${name}"]`)) {
      if (!el.closest(tag)) targets.push(el)
    }
  }
  for (const el of controller.querySelectorAll(`[data-targets~="${tag}.${name}"]`)) {
    if (el.closest(tag) === controller) targets.push(el)
  }
  return targets
}
