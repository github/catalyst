---
subtitle: Origins & Concepts
chapter: 1
---

Catalyst is a set of patterns and techniques for developing _components_ within a complex application. At its core, Catalyst simply provides a small library of functions to make developing [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) easier. The library is an implementation detail, though. The concepts are what we're most interested in.

## How did we get here?

GitHub's first page interactions were written using jQuery, which was widely used at the time. Eventually, as browser compatibility increased and jQuery patterns such as the Selector Pattern & easy class manipulation became standard, [GitHub moved away from jQuery](https://github.blog/2018-09-06-removing-jquery-from-github-frontend/).

Rather than moving to entirely new paradigms, GitHub continued to use the same concepts within jQuery. Event Delegation was still heavily used, as well as querySelector. The event delegation concept was also extended to "element delegation" - discovering when Elements were added to the DOM, using the [Selector Observer](https://github.com/josh/selector-observer) library.

These patterns were reduced to first principles: _Observing_ elements on the page, _listening_ to the events these elements or their children emit, and _querying_ the children of an element to mutate or extend them.

The Web Systems team at GitHub explored other tools that adopt these set of patterns and principles. The closest match to those goals was [Stimulus](https://stimulusjs.org/) (from which Catalyst is heavily inspired), but ultimately the desire to leverage technology that engineers at GitHub were already familiar with was the motivation to create Catalyst.

## Three core concepts: Observe, Listen, Query

Catalyst takes these three core concepts and delivers them in the lightest possible way they can be delivered.

 - **Observability** Catalyst solves observability by leveraging [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements). Custom Elements are given unique names within a system, and the browser will automatically use the Custom Element registry to observe these Elements entering and leaving the DOM. Read more about this in the Guide Section entitled [Your First Component]({{ site.baseurl }}/guide/your-first-component).

 - **Listening** Event Delegation makes a great deal of sense when observing events "high up the tree" - registering global event listeners on the Window element - but Custom Elements sit much closer to their children within the tree, and so Direct Event binding is preferred. Catalyst solves this by binding event listeners to any descendants with `data-action` attributes. Read more about this in the Guide Section entitled [Actions]({{ site.baseurl }}/guide/actions).

 - **Querying** Custom Elements largely solve querying, by simply calling `querySelector` - however CSS selectors are loosely disciplined and can create unnecessary coupling to the DOM structure (e.g. by querying tag names). Catalyst extends the `data-action` concept by also using `data-target` to declare descendants that the Custom Element is interested in querying. Read more about this in the Guide Section entitled [Targets]({{ site.baseurl }}/guide/targets).
