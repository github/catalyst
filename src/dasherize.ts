export const dasherize = (str: unknown): string =>
  String(str)
    .replace(/([A-Z]($|[a-z]))/g, '-$1')
    .replace(/--/g, '-')
    .replace(/^-|-$/, '')
    .toLowerCase()
