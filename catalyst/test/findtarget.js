import {findTarget, findTargets} from '../lib/findtarget.js'
import chai from 'chai'
import spies from 'chai-spies'
chai.use(spies)
const {spy} = chai
const {expect} = chai

describe('findTarget', () => {
  class FakeElement {
    closest() {}
  }
  class MyController {
    get tagName() {
      return 'my-controller'
    }
    querySelectorAll() {}
  }

  it('calls querySelectorAll with the controller name and target name', () => {
    const instance = new MyController()
    spy.on(instance, 'querySelectorAll', () => [])
    findTarget(instance, 'foo')
    expect(instance.querySelectorAll).to.have.been.called.once.with.exactly('[data-target*="my-controller.foo"]')
  })

  it('returns first element where closest tag is the controller', () => {
    const els = [new FakeElement(), new FakeElement()]
    const instance = new MyController()
    spy.on(instance, 'querySelectorAll', () => els)
    spy.on(els[0], 'closest', () => null)
    spy.on(els[1], 'closest', () => instance)
    const target = findTarget(instance, 'foo')
    expect(els[0].closest).to.have.been.called.once.with.exactly('my-controller')
    expect(els[1].closest).to.have.been.called.once.with.exactly('my-controller')
    expect(target).to.equal(els[1])
  })
})

describe('findTargets', () => {
  class FakeElement {
    closest() {}
  }
  class MyController {
    get tagName() {
      return 'my-controller'
    }
    querySelectorAll() {}
  }

  it('calls querySelectorAll with the controller name and target name', () => {
    const instance = new MyController()
    spy.on(instance, 'querySelectorAll', () => [])
    findTargets(instance, 'foo')
    expect(instance.querySelectorAll).to.have.been.called.once.with.exactly('[data-target*="my-controller.foo"]')
  })

  it('returns all elements where closest tag is the controller', () => {
    const els = [new FakeElement(), new FakeElement(), new FakeElement()]
    const instance = new MyController()
    spy.on(instance, 'querySelectorAll', () => els)
    spy.on(els[0], 'closest', () => instance)
    spy.on(els[1], 'closest', () => null)
    spy.on(els[2], 'closest', () => instance)
    const targets = findTargets(instance, 'foo')
    expect(els[0].closest).to.have.been.called.once.with.exactly('my-controller')
    expect(els[1].closest).to.have.been.called.once.with.exactly('my-controller')
    expect(els[2].closest).to.have.been.called.once.with.exactly('my-controller')
    expect(targets).to.deep.equal([els[0], els[2]])
  })
})
