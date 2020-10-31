export function autoShadowRoot(element: HTMLElement): void {
  for (const template of element.querySelectorAll<HTMLTemplateElement>('template[data-shadowroot]')) {
    if (template.parentElement === element) {
      element
        .attachShadow({
          mode: template.getAttribute('data-shadowroot') === 'closed' ? 'closed' : 'open'
        })
        .appendChild(template.content.cloneNode(true))
    }
  }
}
