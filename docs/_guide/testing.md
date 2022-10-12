---
version: 1
chapter: 12
title: Testing
subtitle: Tips for automated testing
---

Catalyst controllers are based on Web Components, and as such need the Web Platform environment to run in, including in tests. It's possible to run these tests in "browser like" environments such as NodeJS or Deno with libraries like jsdom, but it's best to run tests directly in the browser.

### Recommended Libraries

We recommend using [`@web/test-runner`](https://modern-web.dev/docs/test-runner/overview/), which provides the `web-test-runner` command line tool that can run [mocha](https://mochajs.org/) test files in a headless Chromium instance. We also recommend using [`@open-wc/testing`](https://open-wc.org/docs/testing/testing-package/) which provides a set of testing functions, including `expect` from [Chai](https://www.chaijs.com/api/bdd/). If you're using TypeScript, it may be worth also installing [`@web/dev-server-esbuild`](https://modern-web.dev/docs/dev-server/overview/) which can transpile TypeScript to JavaScript, allowing the use of TypeScript within test files themselves.

With these installed and configured your `package.json` might look something like:

```json
{
  "name": "my-catalyst-component",
  "scripts": {
    "test": "web-test-server"
  },
  "devDependencies": {
    "@web/dev-server-esbuild": "^0.3.0",
    "@web/test-runner": "^0.13.27",
    "@open-wc/testing": "^3.1.2"
  }
}
```

You can configure the `web-test-server` by writing a `web-test-runner.config.js` file, which sets up the esbuild plugin to transpile TypeScript, and configure the directory containing your test files: 

```typescript
import {esbuildPlugin} from '@web/dev-server-esbuild'

export default {
  files: ['test/*'],
  nodeResolve: true,
  plugins: [esbuildPlugin({ts: true})]
}
```

#### Example Test File

With this set-up, the boilerplate for an Element test suite might look something like this:

```typescript
// test/my-controller.ts
import {expect, fixture, html} from '@open-wc/testing'
import {MyController} from '../src/my-controller'

describe('MyController', () => {
  let instance
  beforeEach(async () => {
    instance = await fixture(html`<my-controller>
      <div class="expected-children"></div>
    </my-controller>`)
  })

  it('is a Catalyst controller', () => {
    expect(instance).to.have.attribute('data-catalyst')
  })
  
  it('matches snapshot', () => {
    expect(instance).dom.to.equalSnapshot()
  })
  
  it('passes Axe tests', () => 
    expect(instance).to.be.accessible()
  })
  
  it('...') // Fill out the rest
})
```

##### Useful Assertions

The `@open-wc/testing` package exports the `expect` function from Chai, but also automatically registers a set of plugins useful for writing web components, including [chai-a11y-axe](https://www.npmjs.com/package/chai-a11y-axe) and [chai-dom](https://www.npmjs.com/package/chai-dom). Here are some handy example assertions which may be commonly written:


- `expect(instance).to.be.accessible()` - Runs a suite of [Axe](https://www.npmjs.com/package/axe) accessibility tests on the element.
- `expect(instance).dom.to.equalSnapshot()` - Stores a snaphsot test of the existing DOM, which can be tested against later, for regressions.
- `expect(instance).shadowDom.to.equalSnapshot()` - Stores a snaphsot test of the existing ShadowDOM, which can be tested against later, for regressions.
- `expect(instance).to.have.class('foo')` - Checks the element has the `foo` class (like `el.classList.contains('foo')`).
- `expect(instance).to.have.attribute('foo')` - Checks the element has the `foo` attribute (like `el.hasAttribute('foo')`).
- `expect(instance).to.have.attribute('foo')` - Checks the element has the `foo` attribute (like `el.hasAttribute('foo')`).
- `expect(instance).to.have.descendants('.foo')` - Checks the element has elements matching the selector `.foo` attribute (like `el.querySelectorAll('foo')`).

