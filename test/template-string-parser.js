import {parse} from '../lib/template-string-parser.js'

describe('template-string-parser', () => {
  it('extracts `{{}}` surrounding exprs as expr tokens', () => {
    expect(Array.from(parse('{{x}}'))).to.eql([{type: 'expr', start: 0, end: 5, value: 'x'}])
  })

  it('tokenizes a template string successfully', () => {
    expect(Array.from(parse('hello {{x}}'))).to.eql([
      {type: 'text', start: 0, end: 6, value: 'hello '},
      {type: 'expr', start: 6, end: 11, value: 'x'}
    ])
  })

  it('tokenizes multiple values', () => {
    expect(Array.from(parse('hello {{x}} and {{y}}'))).to.eql([
      {type: 'text', start: 0, end: 6, value: 'hello '},
      {type: 'expr', start: 6, end: 11, value: 'x'},
      {type: 'text', start: 11, end: 16, value: ' and '},
      {type: 'expr', start: 16, end: 21, value: 'y'}
    ])
  })

  it('ignores single braces', () => {
    expect(Array.from(parse('hello ${world?}'))).to.eql([{type: 'text', start: 0, end: 15, value: 'hello ${world?}'}])
  })

  it('ignores mismatching parens, treating them as text', () => {
    expect(Array.from(parse('hello {{'))).to.eql([
      {type: 'text', start: 0, end: 6, value: 'hello '},
      {type: 'text', start: 6, end: 8, value: '{{'}
    ])
    expect(Array.from(parse('hello }}'))).to.eql([{type: 'text', start: 0, end: 8, value: 'hello }}'}])
  })
})
