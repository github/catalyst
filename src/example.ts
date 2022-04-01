import {controller} from './controller.js'

@controller
export class HelloWorldElement extends HTMLElement {
  connectedCallback() {
    this.innerHTML = 'Hello World'
  }
}

@controller
export class HelloWorld2Element extends HelloWorldElement {
  connectedCallback() {
    this.innerHTML = 'Hello World2'
  }
}

@controller({extends: 'p'})
export class HelloWorld3Element extends HTMLParagraphElement {
  connectedCallback() {
    this.innerHTML = 'Hello World3'
  }
}

@controller({extends: 'p'})
export class HelloWorld4Element extends HelloWorld3Element {
  connectedCallback() {
    this.innerHTML = 'Hello World4'
  }
}

/*
<p is="hello-world"></p>
<hello-world2></hello-world2>
<script type="module">
    import '../lib/example.js'
</script>
*/
