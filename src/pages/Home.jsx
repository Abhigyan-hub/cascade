import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import EventCard from '../components/EventCard'

export default function Home() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoading(false)
    }, 10000)

    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            event_images(storage_path, sort_order),
            profiles!events_created_by_fkey(full_name)
          `)
          .eq('is_published', true)
          .order('event_date', { ascending: true })

        if (!error) {
          setEvents(data || [])
        } else {
          console.error('Events fetch error:', error)
        }
      } catch (error) {
        console.error('Events fetch failed:', error)
      } finally {
        clearTimeout(timeoutId)
        setLoading(false)
      }
    }
    
    fetchEvents()
    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          CASCADE <span className="text-cascade-purple">Events</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Department of CSE & AI • GHRSTU — Browse and register for workshops, hackathons, and tech events.
        </p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="aspect-video bg-cascade-dark" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-cascade-dark rounded w-3/4" />
                <div className="h-4 bg-cascade-dark rounded w-1/2" />
                <div className="h-10 bg-cascade-dark rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No events yet. Check back soon!</p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } },
            hidden: {},
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {events.map((event) => (
            <motion.div
              key={event.id}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              <EventCard
                event={event}
                images={event.event_images?.sort((a, b) => a.sort_order - b.sort_order) || []}
                organizer={event.profiles}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
