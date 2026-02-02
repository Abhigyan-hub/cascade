import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function EventCarousel({ images, alt = 'Event' }) {
  const [current, setCurrent] = useState(0)
  const [urls, setUrls] = useState([])

  useEffect(() => {
    if (!images?.length) return
    const resolved = images.map((img) => {
      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(img.storage_path)
      return publicUrl
    })
    setUrls(resolved)
  }, [images])

  useEffect(() => {
    if (urls.length <= 1) return
    const t = setInterval(() => {
      setCurrent((c) => (c + 1) % urls.length)
    }, 4000)
    return () => clearInterval(t)
  }, [urls.length])

  if (!urls.length) return null

  return (
    <div className="relative w-full h-full">
      <img
        src={urls[current]}
        alt={`${alt} - image ${current + 1}`}
        className="w-full h-full object-cover transition-opacity duration-500"
      />
      {urls.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + urls.length) % urls.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % urls.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {urls.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === current ? 'bg-cascade-purple' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
