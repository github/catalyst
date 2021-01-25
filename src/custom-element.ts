export interface CustomElement {
  new (): HTMLElement
  observedAttributes?: string[]
}
