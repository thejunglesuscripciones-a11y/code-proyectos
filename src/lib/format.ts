/** Short "editado por" caption timestamp: "hoy, 14:32", "ayer, 09:10", or "3 ene" for anything older. */
export function formatAttributionDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const time = date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dayDiff = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / (1000 * 60 * 60 * 24))

  if (dayDiff === 0) return `hoy, ${time}`
  if (dayDiff === 1) return `ayer, ${time}`
  return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
}
