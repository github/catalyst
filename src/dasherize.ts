export const dasherize = (str: unknown): string =>
  String(typeof str === 'symbol' ? str.description : str)
    .replace(/([A-Z]($|[a-z]))/g, '-$1')
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
