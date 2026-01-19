import {chai} from 'vitest'
import chaiDom from 'chai-dom'
import sinonChai from 'sinon-chai'

// Extend chai with DOM assertions
chai.use(chaiDom)

// Extend chai with sinon assertions
chai.use(sinonChai)
