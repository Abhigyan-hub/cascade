export function eventImageUrl(image) {
  if (!image) return ''
  return image.public_url || image.url || image.image_url || ''
}

export function sortedEventImages(event) {
  return [...(event?.event_images || [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )
}

export function firstEventImageUrl(event) {
  return eventImageUrl(sortedEventImages(event)[0])
}
