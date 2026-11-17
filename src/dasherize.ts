export const dasherize = (str: unknown): string =>
  String(typeof str === 'symbol' ? str.description : str)
    // Split an acronym from a following capitalized word (`URLBar` -> `URL-Bar`,
    // `mySVGIcon` -> `mySVG-Icon`).
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    // Split a lowercase letter or digit from a following capital (`fooBar` -> `foo-Bar`,
    // `srcURL` -> `src-URL`). Boundaries are also kept after other non-uppercase
    // characters, so `CaféBarElement` keeps its `café-Bar` boundary and `Foo_BarElement`
    // keeps its `Foo_-Bar` boundary (both still register after `-element` is stripped).
    .replace(/([^A-Z])([A-Z])/g, '$1-$2')
    .replace(/--/g, '-')
    .replace(/^-|-$/, '')
    .toLowerCase()

export const mustDasherize = (str: unknown, type = 'property'): string => {
  const dashed = dasherize(str)
  if (!dashed.includes('-')) {
    throw new DOMException(`${type}: ${String(str)} is not a valid ${type} name`, 'SyntaxError')
  }
  return dashed
}
