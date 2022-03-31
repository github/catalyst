import { controller } from "./controller.js"

@controller({extends: "p"})
class HelloWorldElement extends HTMLParagraphElement {
    connectedCallback(){
        this.innerHTML = "Hello World"
    }
}

@controller
class HelloWorld2Element extends HTMLElement {
    connectedCallback(){
        this.innerHTML = "Hello World2"
    }
}

/*
<p is="hello-world"></p>
<hello-world2></hello-world2>
<script type="module">
    import '../lib/example.js'
</script>
*/