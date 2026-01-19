import {expect as vitestExpect} from 'vitest'

/**
 * Tagged template literal function that creates HTML from a template string.
 * This is compatible with @open-wc/testing's html function.
 */
export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
  let result = ''
  for (let i = 0; i < strings.length; i++) {
    result += strings[i]
    if (i < values.length) {
      result += values[i]
    }
  }
  return result
}

/**
 * Creates a DOM element from HTML string and appends it to the document body.
 * Returns the element after it's been connected to the DOM.
 * Compatible with @open-wc/testing's fixture function.
 */
export async function fixture<T extends HTMLElement>(template: string): Promise<T> {
  const container = document.createElement('div')
  container.innerHTML = template.trim()
  const element = container.firstElementChild as T
  
  if (!element) {
    throw new Error('No element found in template')
  }
  
  document.body.appendChild(element)
  
  // Wait for next frame to ensure element is fully connected
  await new Promise(resolve => requestAnimationFrame(resolve))
  
  return element
}

// Re-export vitest's expect which includes chai-compatible assertions
export const expect = vitestExpect
