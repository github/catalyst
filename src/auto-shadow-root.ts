export function autoShadowRoot(element: HTMLElement): void {
  for (const template of element.querySelectorAll<HTMLTemplateElement>('template[shadowroot]')) {
    if (template.parentElement === element) {
      element
        .attachShadow({
          mode: template.getAttribute('shadowroot') === 'closed' ? 'closed' : 'open'
        })
        .append(template.content.cloneNode(true))
    }
  }
}
