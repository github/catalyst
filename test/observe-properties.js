import {observeProperties} from '../lib/observe-properties.js'

describe('observeProperties', () => {
  it('returns a class with the same name', () => {
    const Class = observeProperties(class MyController {})
    expect(Class.name).to.equal('MyController')
  })

  it('changes all observeProperties into getter/setters', () => {
    const Class = observeProperties(
      class {
        static observedProperties = ['name', 'age']
        name = ''
        age = 0
      }
    )
    const instance = new Class()
    expect(instance.name).to.equal('')
    expect(instance.age).to.equal(0)
    expect(instance).to.have.ownPropertyDescriptor('name').with.property('get')
    expect(instance).to.have.ownPropertyDescriptor('name').with.property('set')
    expect(instance).to.have.ownPropertyDescriptor('age').with.property('get')
    expect(instance).to.have.ownPropertyDescriptor('age').with.property('set')
  })

  it("add getter/setters for observeProperties even if they don't exist on the class yet", () => {
    const Class = observeProperties(
      class {
        static observedProperties = ['name', 'age']
      }
    )
    const instance = new Class()
    expect(instance.name).to.equal(undefined)
    expect(instance.age).to.equal(undefined)
    expect(instance).to.have.ownPropertyDescriptor('name').with.property('get')
    expect(instance).to.have.ownPropertyDescriptor('name').with.property('set')
    expect(instance).to.have.ownPropertyDescriptor('age').with.property('get')
    expect(instance).to.have.ownPropertyDescriptor('age').with.property('set')
  })

  it('allows properties to be get/set as normal', () => {
    const Class = observeProperties(
      class {
        static observedProperties = ['name']
      }
    )
    const instance = new Class()
    expect(instance.name).to.equal(undefined)
    instance.name = 'A'
    expect(instance.name).to.equal('A')
    instance.name = 'B'
    expect(instance.name).to.equal('B')
  })

  it('calls propertyChangedCallback when a value is set', () => {
    const Class = observeProperties(
      class {
        static observedProperties = ['name', 'age']
        propertyChangedCallback = chai.spy()
        name = 'X'
        age = 0
      }
    )
    const instance = new Class()
    instance.name = 'Y'
    expect(instance.propertyChangedCallback).to.have.been.called.once.with.exactly('name', 'X', 'Y')
    instance.age = 100
    expect(instance.propertyChangedCallback).to.have.been.called.twice.with.exactly('age', 0, 100)
  })

  it('calls propertyChangedCallback with the new and old values in expected order`', () => {
    const Class = observeProperties(
      class {
        static observedProperties = ['name']
        propertyChangedCallback = chai.spy()
        name = 'A'
      }
    )
    const instance = new Class()
    expect(instance.name).to.equal('A')
    instance.name = 'B'
    expect(instance.name).to.equal('B')
    expect(instance.propertyChangedCallback).to.have.been.called.once.with.exactly('name', 'A', 'B')
    instance.name = 'C'
    expect(instance.name).to.equal('C')
    expect(instance.propertyChangedCallback).to.have.been.called.twice.second.with.exactly('name', 'B', 'C')
  })

  it('delegates to the prototype getter/setter if present', () => {
    let i = 0
    const Class = observeProperties(
      class {
        static observedProperties = ['i']
        propertyChangedCallback = chai.spy()
        get i() {
          return i
        }
        set i(_i) {
          i = _i
        }
      }
    )
    const instance = new Class()
    expect(instance.i).to.equal(0)
    i = 1
    expect(instance.i).to.equal(1)
    i = 2
    expect(instance.i).to.equal(2)
    i = 3
    expect(instance.i).to.equal(3)
    instance.i = 1
    expect(i).to.equal(1)
    expect(instance.propertyChangedCallback).to.have.been.called.once.with.exactly('i', 3, 1)
  })

  it('uses the prototype getter/setter to calculate derived values', () => {
    const Class = observeProperties(
      class {
        static observedProperties = ['state']
        propertyChangedCallback = chai.spy()
        _state = 'closed'
        get state() {
          return `state-${this._state}`
        }
        set state(state) {
          this._state = state.replace(/^state-/, '')
        }
      }
    )
    const instance = new Class()
    instance.state = 'open'
    expect(instance.propertyChangedCallback).to.have.been.called.once.with('state', 'state-open', 'state-closed')
  })
})
