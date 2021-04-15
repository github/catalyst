export function autoShadowRoot(element: HTMLElement): void {
  for (const template of element.querySelectorAll<HTMLTemplateElement>('template')) {
    if (template.parentElement === element) {
      const prefix = template.hasAttribute('data-shadowroot') ? 'data-' : ''

      if (
        template.hasAttribute('data-shadowroot') ||
        (template.hasAttribute('shadowroot') && !HTMLTemplateElement.prototype.hasOwnProperty('shadowroot'))
      ) {
        element
          .attachShadow({
            mode: template.getAttribute(`${prefix}shadowroot`) === 'closed' ? 'closed' : 'open'
          })
          .append(template.content.cloneNode(true))
      }
    }
  }
}
