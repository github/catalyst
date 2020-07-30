import {StampedTemplate} from '../lib/stamped-template.js'

function testProcessor(parts, params) {
  for (const part of parts) {
    const key = part.expression.trim()
    const value = (key in params ? params[key] : '')
    part.replaceWith(value)
  }
}

describe('stamped-template', () => {
  it('applies data to templated text nodes', () => {
    const template = document.createElement('template')
    const originalHTML = `{{x}}`
    template.innerHTML = originalHTML
    const instance = new StampedTemplate(template, testProcessor, {x: 'Hello world'})
    expect(template.innerHTML).to.equal(originalHTML)
    const root = document.createElement('div')
    root.appendChild(instance.fragment)
    expect(root.innerHTML).to.equal(`Hello world`)
  })
  it('can render into partial text nodes', () => {
    const template = document.createElement('template')
    const originalHTML = `Hello {{x}}!`
    template.innerHTML = originalHTML
    const instance = new StampedTemplate(template, testProcessor, {x: 'world'})
    expect(template.innerHTML).to.equal(originalHTML)
    const root = document.createElement('div')
    root.appendChild(instance.fragment)
    expect(root.innerHTML).to.equal(`Hello world!`)
  })
  it('can render nested text nodes', () => {
    const template = document.createElement('template')
    const originalHTML = '<div><div>Hello {{x}}!</div></div>'
    template.innerHTML = originalHTML
    const instance = new StampedTemplate(template, testProcessor, {x: 'world'})
    expect(template.innerHTML).to.equal(originalHTML)
    const root = document.createElement('div')
    root.appendChild(instance.fragment)
    expect(root.innerHTML).to.equal(`<div><div>Hello world!</div></div>`)
  })
  it('applies data to templated attributes', () => {
    const template = document.createElement('template')
    const originalHTML = `<div class="{{y}}"></div>`
    template.innerHTML = originalHTML
    const instance = new StampedTemplate(template, testProcessor, {y: 'foo'})
    expect(template.innerHTML).to.equal(originalHTML)
    const root = document.createElement('div')
    root.appendChild(instance.fragment)
    expect(root.innerHTML).to.equal(`<div class="foo"></div>`)
  })
  it('can render into partial attribute nodes', () => {
    const template = document.createElement('template')
    const originalHTML = `<div class="my-{{y}}-state"></div>`
    template.innerHTML = originalHTML
    const instance = new StampedTemplate(template, testProcessor, {y: 'foo'})
    expect(template.innerHTML).to.equal(originalHTML)
    const root = document.createElement('div')
    root.appendChild(instance.fragment)
    expect(root.innerHTML).to.equal(`<div class="my-foo-state"></div>`)
  })
  it('can render into many values', () => {
    const template = document.createElement('template')
    const originalHTML = `<div class="my-{{x}}-state {{y}}">{{z}}</div>`
    template.innerHTML = originalHTML
    const instance = new StampedTemplate(template, testProcessor, {x: 'foo', y: 'bar', z: 'baz'})
    expect(template.innerHTML).to.equal(originalHTML)
    const root = document.createElement('div')
    root.appendChild(instance.fragment)
    expect(root.innerHTML).to.equal(`<div class="my-foo-state bar">baz</div>`)
  })
  it('it allows spaces inside template part identifiers', () => {
    const template = document.createElement('template')
    const originalHTML = `<div class="my-{{ x }}-state {{ y }}">{{         z          }}</div>`
    template.innerHTML = originalHTML
    const instance = new StampedTemplate(template, testProcessor, {x: 'foo', y: 'bar', z: 'baz'})
    expect(template.innerHTML).to.equal(originalHTML)
    const root = document.createElement('div')
    root.appendChild(instance.fragment)
    expect(root.innerHTML).to.equal(`<div class="my-foo-state bar">baz</div>`)
  })

  describe('updating', () => {
    it('it updates all nodes with new values', () => {
      const template = document.createElement('template')
      const originalHTML = `<div class="my-{{ x }}-state {{ y }}">{{ z }}</div>`
      template.innerHTML = originalHTML
      const instance = new StampedTemplate(template, testProcessor, {x: 'foo', y: 'bar', z: 'baz'})
      expect(template.innerHTML).to.equal(originalHTML)
      const root = document.createElement('div')
      root.appendChild(instance.fragment)
      expect(root.innerHTML).to.equal(`<div class="my-foo-state bar">baz</div>`)
      instance.update({x: 'bing', y: 'bong', z: 'quux'})
      expect(root.innerHTML).to.equal(`<div class="my-bing-state bong">quux</div>`)
    })
  })
})
