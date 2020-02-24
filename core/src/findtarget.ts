/**
 * Create a property on the controller instance referencing the element with a
 * `data-target` element of the same name.
 */

const createSelector = (receiver: Element, key: string) => `[data-target*="${receiver.tagName.toLowerCase()}.${key}"]`

export function findTarget(controller: HTMLElement, name: string) {
  const tag = controller.tagName.toLowerCase()
  for (const el of controller.querySelectorAll(`[data-target*="${tag}.${name}"]`)) {
    if (el.closest(tag) === controller) return el
  }
}

export function findTargets(controller: HTMLElement, name: string) {
  const tag = controller.tagName.toLowerCase()
  const targets = []
  for (const el of controller.querySelectorAll(`[data-target*="${tag}.${name}"]`)) {
    if (el.closest(tag) === controller) targets.push(el)
  }
  return targets
}
