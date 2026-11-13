// Compile-time checks, run under both decorator modes: `tsc` (experimentalDecorators) and `tsc -p test/standard`
// (standard decorators). Nothing here runs. `@target` and `@targets` need `accessor` in standard mode and a plain
// field in legacy mode, so they're covered by test/target.ts and test/standard/target.ts instead.
import {controller} from '../../src/controller.js'
import {attr} from '../../src/attr.js'
import type {CustomElementClass} from '../../src/custom-element.js'

@controller
export class TypesElement extends HTMLElement {
  static attrPrefix = 'types-'
  static observedAttributes = ['data-extra']

  @attr text = ''
  @attr count = 0
  @attr enabled = false

  @attr
  get computed(): string {
    return ''
  }
  set computed(value: string) {
    this.text = value
  }

  // @ts-expect-error attrs must be strings, numbers or booleans
  @attr date = new Date()
}

@controller('types-named-element')
export class TypesNamedElement extends HTMLElement {}

controller('types-direct-element')(class TypesDirectElement extends HTMLElement {})
controller(class TypesDirectUnnamedElement extends HTMLElement {})
attr(TypesElement.prototype, 'text')

// The decorator `controller(name)` returns is still assignable to the legacy class decorator type.
export const named: (classObject: CustomElementClass) => void = controller('types-assigned-element')
