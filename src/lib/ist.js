export const IST_TIME_ZONE = 'Asia/Kolkata'
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000

function toDate(value) {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function istParts(date) {
  const map = {}
  for (const part of new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)) {
    if (part.type !== 'literal') map[part.type] = part.value
  }
  return map
}

export function formatIst(value, style = 'datetime') {
  const d = toDate(value)
  if (!d) return ''
  const base = { timeZone: IST_TIME_ZONE }
  if (style === 'date') {
    return new Intl.DateTimeFormat('en-IN', {
      ...base,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d)
  }
  if (style === 'weekday') {
    return `${new Intl.DateTimeFormat('en-IN', {
      ...base,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d)} IST`
  }
  if (style === 'short') {
    return `${new Intl.DateTimeFormat('en-IN', {
      ...base,
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d)} IST`
  }
  return `${new Intl.DateTimeFormat('en-IN', {
    ...base,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)} IST`
}

/** Fill datetime-local with the IST wall clock of an instant. */
export function toIstDatetimeLocal(value) {
  const d = toDate(value)
  if (!d) return ''
  const p = istParts(d)
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

/** Treat datetime-local as IST and return UTC ISO for the API. */
export function istDatetimeLocalToIso(value) {
  if (!value) return null
  const [datePart, timePart = '00:00'] = String(value).split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  if (![year, month, day, hour, minute].every((n) => Number.isFinite(n))) return null
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - IST_OFFSET_MS
  return new Date(utcMs).toISOString()
}
