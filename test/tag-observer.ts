import {expect, fixture, html} from '@open-wc/testing'
import {fake, match} from 'sinon'
import {register, add} from '../src/tag-observer.js'

describe('tag observer', () => {
  let instance: HTMLElement
  beforeEach(async () => {
    instance = await fixture(html`<section>
      <div data-tagtest="section.a.b.c section.d.e.f doesntexist.g.h.i"></div>
    </section>`)
  })

  it('can register new tag observers', () => {
    register('foo', fake(), fake())
  })

  it('throws an error when registering a duplicate', () => {
    register('duplicate', fake(), fake())
    expect(() => register('duplicate', fake(), fake())).to.throw()
  })

  describe('registered behaviour', () => {
    const testParse = fake(v => v.split('.'))
    const testFound = fake()
    register('data-tagtest', testParse, testFound)
    beforeEach(() => {
      add(instance)
    })

    it('uses parse to extract tagged element values', () => {
      expect(testParse).to.be.calledWithExactly('section.a.b.c')
      expect(testParse).to.be.calledWithExactly('section.d.e.f')
      expect(testParse).to.be.calledWithExactly('doesntexist.g.h.i')
    })

    it('calls found with el and args based from testParse', () => {
      const div = instance.querySelector('div')!
      expect(testFound).to.be.calledWithExactly(div, instance, 'data-tagtest', 'a', 'b', 'c')
      expect(testFound).to.be.calledWithExactly(div, instance, 'data-tagtest', 'd', 'e', 'f')
      expect(testFound).to.not.be.calledWithMatch(match.any, match.any, 'data-tagtest', 'g', 'h', 'i')
    })

    it('calls found if added to a node that has tags on itself', () => {
      const div = document.createElement('div')
      div.setAttribute('data-tagtest', 'div.j.k.l')
      add(div)
      expect(testParse).to.be.calledWithExactly('div.j.k.l')
      expect(testFound).to.be.calledWithExactly(div, div, 'data-tagtest', 'j', 'k', 'l')
    })

    it('pierces shadowdom boundaries to find nearest controller', () => {
      const div = document.createElement('div')
      const shadow = div.attachShadow({mode: 'open'})
      const span = document.createElement('span')
      span.setAttribute('data-tagtest', 'div.m.n.o')
      shadow.append(span)
      add(span)
      expect(testParse).to.be.calledWithExactly('div.m.n.o')
      expect(testFound).to.be.calledWithExactly(span, div, 'data-tagtest', 'm', 'n', 'o')
    })

    it('queries inside shadowdom, and pierces to find nearest controller', () => {
      const div = document.createElement('div')
      const shadow = div.attachShadow({mode: 'open'})
      const span = document.createElement('span')
      span.setAttribute('data-tagtest', 'div.p.q.r')
      shadow.append(span)
      add(shadow)
      expect(testParse).to.be.calledWithExactly('div.p.q.r')
      expect(testFound).to.be.calledWithExactly(span, div, 'data-tagtest', 'p', 'q', 'r')
    })

    describe('mutations', () => {
      it('calls parse+found on attributes that change', async () => {
        instance.setAttribute('data-tagtest', 'section.s.t.u not.v.w.x')
        await Promise.resolve()
        expect(testParse).to.be.calledWithExactly('section.s.t.u')
        expect(testParse).to.be.calledWithExactly('not.v.w.x')
        expect(testFound).to.be.calledWithExactly(instance, instance, 'data-tagtest', 's', 't', 'u')
        expect(testFound).to.not.be.calledWithMatch(match.any, match.any, 'data-tagtest', 'v', 'w', 'x')
      })
    })
  })
})
