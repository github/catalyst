export interface CustomElement extends HTMLElement {
  connectedCallback?(): void
  attributeChangedCallback?(name: string, oldValue: string | null, newValue: string | null): void
  disconnectedCallback?(): void
  adoptedCallback?(): void
  formAssociatedCallback?(form: HTMLFormElement): void
  formDisabledCallback?(disabled: boolean): void
  formResetCallback?(): void
  formStateRestoreCallback?(state: unknown, reason: 'autocomplete' | 'restore'): void
}

export interface CustomElementClass {
  // TS mandates Constructors that get mixins have `...args: any[]`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): CustomElement
  observedAttributes?: string[]
  disabledFeatures?: string[]
  formAssociated?: boolean

  attrPrefix?: string
}
