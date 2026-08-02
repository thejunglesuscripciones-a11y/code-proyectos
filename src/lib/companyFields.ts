/** Converts a label into a safe {word} token suffix: lowercase, no accents, underscores instead of spaces/symbols. */
export function slugify(label: string): string {
  const base = label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return base || 'campo'
}

/** Generates a unique field id from a label, appending _2, _3... if it collides with an existing id. */
export function generateFieldId(label: string, existingIds: string[]): string {
  const base = slugify(label)
  if (!existingIds.includes(base)) return base
  let suffix = 2
  while (existingIds.includes(`${base}_${suffix}`)) suffix++
  return `${base}_${suffix}`
}
