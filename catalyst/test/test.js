import assert from 'assert'
import {wrap} from '../lib/wrap.js'

class MyController {
  connectedCallback() { }
}

describe('catalyst', function() {
  it('wraps a method that exists', function() {
    let called = false
    wrap(MyController, "connectedCallback", () => called = true)
    const controller = new MyController()
    controller.connectedCallback()
    assert(called)
  })
})
