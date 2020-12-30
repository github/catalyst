function storeColorSchemePreference() {
  // Get color scheme preference from URL
  const url = new URL(window.location.href)
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
