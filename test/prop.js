import {prop} from '../lib/prop.js'
import {__decorate} from '../node_modules/tslib/tslib.es6.js'

describe('prop', () => {
  it('adds the property name to the classes `observedProperties` static member', () => {
    class Foo {
      name = 1
    }
    __decorate([prop], Foo.prototype, 'name', null)
    expect(Foo.observedProperties).to.eql(['name'])
  })

  it('appends the property name to an existing `observedProperties` member', () => {
    class Foo {
      static observedProperties = ['existing']
      name = 1
    }
    __decorate([prop], Foo.prototype, 'name', null)
    expect(Foo.observedProperties).to.eql(['existing', 'name'])
  })

  it('overrides observedProperties getter', () => {
    class Foo {
      static get observedProperties() {
        return ['existing']
      }
      name = 1
    }
    __decorate([prop], Foo.prototype, 'name', null)
    expect(Foo.observedProperties).to.eql(['existing', 'name'])
  })
})
