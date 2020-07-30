import {parse} from './template-string-parser.js'
import {AttributeValue, AttributeValuePart} from './attribute-value.js'

type Params = Record<string, unknown>
export type StampedTemplateProcessor = (parts: Iterable<Part>, params: Params) => void

class Part {
  constructor(public parentNode: ChildNode | AttributeValuePart, public expression: string) {}

  get attribute() {
    return this.parentNode instanceof AttributeValuePart
  }

  replaceWith(node: string | ChildNode) {
    if (typeof node === 'string') node = new Text(node)
    this.parentNode = this.parentNode.replaceWith(node) || node
  }
}

function* collectParts(el: DocumentFragment): Generator<Part> {
  const walker = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null, false)
  let node
  while ((node = walker.nextNode())) {
    if (node instanceof Element) {
      for (const name of node.getAttributeNames()) {
        const value = node.getAttribute(name) || ''
        if (value.includes('{{')) {
          const attr = node.getAttributeNode(name)!
          let part = new AttributeValue(attr).children[0]
          for (const token of parse(value)) {
            if (token.end < value.length) {
              const oldPart = part
              part = part.split(token.end - token.start)
              if (token.type === 'expr') {
                yield new Part(oldPart, token.value)
              }
            } else if (token.type === 'expr') {
              yield new Part(part, token.value)
            }
          }
        }
      }
    } else if (node instanceof Text && node.textContent && node.textContent.includes('{{')) {
      for (const token of parse(node.textContent)) {
        if (token.end < node.textContent.length) node.splitText(token.end)
        if (token.type === 'expr') yield new Part(node, token.value)
        break
      }
    }
  }
}

export class StampedTemplate {
  fragment: DocumentFragment
  #processor: StampedTemplateProcessor
  #parts: Iterable<Part>

  constructor(template: HTMLTemplateElement, processor: StampedTemplateProcessor, params: Params) {
    this.fragment = template.content.cloneNode(true) as DocumentFragment
    this.#processor = processor
    this.#parts = Array.from(collectParts(this.fragment))
    this.update(params)
  }
  update(params: Record<string, unknown>): void {
    this.#processor(this.#parts, params)
  }
}
