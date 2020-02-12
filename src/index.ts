import {bind, register, target} from './helpers'

@register
@bind
class HelloController extends HTMLElement {
  @target outputTarget!: HTMLElement;
  @target nameTarget!: HTMLInputElement;

  greet() {
    this.outputTarget.textContent = `Hello, ${this.nameTarget.value}!`;
  }
}
