function storeColorSchemePreference() {
  // Get color scheme preference from URL
  const url = new URL(window.location.href, window.location.origin)
  const params = new URLSearchParams(url.search)

  // Return early if there’s nothing to store
  if (!params.has('prefers-color-scheme')) {
    return
  }

  const param = params.get('prefers-color-scheme').toLowerCase()
  if (['light', 'dark'].includes(param)) {
    // Store preference in Local Storage
    window.localStorage.setItem('prefers-color-scheme', param)
  } else {
    // Clear preference in Local Storage
    window.localStorage.clear('prefers-color-scheme')
  }

  // Remove color scheme preference from URL
  params.delete('prefers-color-scheme')
  url.search = params.toString()
  history.replaceState(null, '', url)
}

function applyColorSchemePreference() {
  // Get color scheme preference from Local Storage
  const preference = window.localStorage.getItem('prefers-color-scheme')

  // Return early if no preference exists
  if (!preference) {
    return
  }

  // Write preference to <body> attribute
  document.body.parentElement.setAttribute('data-prefers-color-scheme', preference)
}

storeColorSchemePreference()
applyColorSchemePreference()

function addAnnotations() {
  for (const codeBlock of document.querySelectorAll('.highlighter-rouge')) {
    const comment = parseCommentNode(codeBlock)
    if (comment.annotations) annotate(codeBlock, comment.annotations)
  }
}

function parseCommentNode(el) {
  const stopAtEl = el.previousElementSibling
  let t = el.previousSibling
  if (!stopAtEl && !t) return
  let comment
  while (t && t !== stopAtEl) {
    if (t.nodeType === 8) {
      comment = t
      break
    } else {
      t = t.previousSibling
    }
  }

  if (!comment) return {}

  const [type, ...details] = comment.textContent.trim().split('\n')

  return {
    noDemo: type.match(/no_demo/),
    onlyDemo: type.match(/only_demo/),
    annotations: type.match(/annotations/) && details
  }
}

let matchIndex = 0
function annotate(codeBlock, items) {
  const noMatch = new Set(items)
  const annotated = new WeakMap()
  for (const el of codeBlock.querySelectorAll('code > span')) {
    for (const item of items) {
      let currentNode = el
      const [pattern, rest] = item.split(/: /)
      const [title, link] = (rest || '').split(/ \| /)
      const parts = pattern.split(' ')
      let toAnnotate = []
      for (const part of parts) {
        if (currentNode && currentNode.textContent.match(part)) {
          toAnnotate.push(currentNode)
          currentNode = currentNode.nextElementSibling
        } else {
          toAnnotate = []
          break
        }
      }
      for (const node of toAnnotate) {
        noMatch.delete(item)
        if (title) {
          if (annotated.get(node)) {
            continue
          }
          annotated.set(node, title)
          const a = document.createElement('a')
          a.className = `${node.className} code-tooltip tooltipped tooltipped-multiline tooltipped-se bg-gray text-underline`
          a.id = `match-${matchIndex++}`
          a.href = link || `#${a.id}`
          a.setAttribute('data-title', title)
          a.textContent = node.textContent
          node.replaceWith(a)
        } else {
          node.classList.add('bg-gray')
        }
      }
    }
  }
  for (const pattern of noMatch) {
    // eslint-disable-next-line no-console
    console.error(`Code annotations: No match found for "${pattern}"`)
  }
}

addAnnotations()
