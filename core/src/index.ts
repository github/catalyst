import {bindEvents, register, target, assertTargets} from './helpers'

@register
@assertTargets
@bindEvents
class HelloController extends HTMLElement {
  @target outputTarget!: HTMLElement;
  @target nameTarget!: HTMLInputElement;
  @target buttonTarget!: HTMLButtonElement;

  greet() {
    this.dataset.foo = 'foo'
    this.outputTarget.textContent = `Hello, ${this.nameTarget.value}!`;
  }
}
