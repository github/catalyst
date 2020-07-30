export class AttributeValuePart {
  #value = ''
  get value(): string {
    return this.#value
  }
  set value(value: string) {
    this.#value = value
    this.parentNode.updateParent()
  }
  constructor(public parentNode: AttributeValue, value: string) {
    this.#value = value
  }
  split(offset: number): AttributeValuePart {
    const node = new AttributeValuePart(this.parentNode, this.#value.slice(offset))
    this.#value = this.#value.slice(0, offset)
    this.parentNode.children.push(node)
    return node
  }
  replaceWith(value: string | ChildNode): AttributeValuePart {
    if (typeof value === 'string') {
      this.value = value
    } else {
      this.value = value.textContent || ''
    }
    return this
  }
}

/**
 * AttributeValue is a stand-in class for the string value of an Attr
 * (Attribute) node. The point of this class is to make the value itself a
 * psuedo Node, comprised of AttributeValuePart children, which allows for
 * selective updates to just the children without having to re-calculate an
 * entire attribute each time. Any updates to AttributeValue or any related
 * AttributeValuePart children will updat the `Attr.value`, which in turn
 * updates the Element's Attribute Value.
 */
export class AttributeValue {
  children: AttributeValuePart[] = []
  get value(): string {
    return this.children.reduce((str, part) => `${str}${part.value}`, '')
  }
  set value(value: string) {
    this.children = [new AttributeValuePart(this, value)]
    this.updateParent()
  }
  constructor(public parentNode: Attr) {
    this.children = [new AttributeValuePart(this, this.parentNode.value)]
  }
  updateParent(): void {
    this.parentNode.value = this.value
  }
}
