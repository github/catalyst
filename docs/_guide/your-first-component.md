---
subtitle: Building an HTMLElement
chapter: 2
---

Custom Elements allow you to create reusable components that you can declare in HTML, and [progressively enhance](https://en.wikipedia.org/wiki/Progressive_enhancement) within JavaScript. Custom Elements must named with a `-` in the HTML name, and the JS class must `extend HTMLElement`. When the browser connects each element class instance to the DOM node, `connectedCallback` is fired - this is where you can change parts of the element. Here's a basic example:

```html
<my-controller></my-controller>
<script>
class MyController extends HTMLElement {
  connectedCallback() {
    this.innerHTML = 'Hello World!'
  }
}
window.customElements.register('my-controller', MyController)
</script>
```
<br>


Here are the three key elements to remember:

 - Custom Elements must have a dash in the name.
 - The JS class must `extend HTMLElement`
 - `connectedCallback` can be used as a life-cycle hook for when the element and class are connected.

### Catalyst

Catalyst saves you writing some of this boilerplate, by automatically calling the `customElements.register` code, and by adding ["Actions"](/guide/actions) and ["Targets"](/guide/targets) features described later. If you're using TypeScript with `decorators` support, simply add `@controller` to the top of your class:

```js
@controller
class MyController extends HTMLElement {
  connectedCallback() {
    this.innerHTML = 'Hello World!'
  }
}
// No longer need this:
// window.customElements.register('my-controller', MyController)
```
<br>

Catalyst will automatically "dasherize" the class name. All capital letters get lowercased and dash separated.

By convention, Catalyst controllers end in `Controller`, but it's not required.

#### What about without Decorators?

If you don't want to use decorators, you can simply wrap the class in a call to `controller`:

```js
controller(
  class MyController extends HTMLElement {
    //...
  }
)
```
<br>
