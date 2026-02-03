import { Link, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import EventCarousel from '../components/EventCarousel'
import { Calendar, MapPin, User, IndianRupee } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../lib/authContext'

export default function EventDetail() {
  const { eventId } = useParams({ strict: false })
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [images, setImages] = useState([])
  const [organizer, setOrganizer] = useState(null)
  const [formFields, setFormFields] = useState([])
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoading(false)
    }, 8000)

    async function fetch() {
      try {
        const { data: ev, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .eq('is_published', true)
          .single()

        if (error || !ev) {
          console.error('Event fetch error:', error)
          setLoading(false)
          return
        }

        setEvent(ev)

        const { data: imgs } = await supabase
          .from('event_images')
          .select('storage_path, sort_order')
          .eq('event_id', eventId)
          .order('sort_order')
        setImages(imgs || [])

        const { data: prof } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', ev.created_by)
          .single()
        setOrganizer(prof)

        const { data: fields } = await supabase
          .from('event_form_fields')
          .select('*')
          .eq('event_id', eventId)
          .order('sort_order')
        setFormFields(fields || [])

        if (user) {
          const { data: reg } = await supabase
            .from('registrations')
            .select('id')
            .eq('event_id', eventId)
            .eq('user_id', user.id)
            .single()
          setAlreadyRegistered(!!reg)
        }
      } catch (error) {
        console.error('Event detail fetch failed:', error)
      } finally {
        clearTimeout(timeoutId)
        setLoading(false)
      }
    }
    
    fetch()
    return () => clearTimeout(timeoutId)
  }, [eventId, user])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="aspect-video bg-cascade-surface rounded-2xl" />
          <div className="h-8 bg-cascade-surface rounded w-2/3" />
          <div className="h-4 bg-cascade-surface rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Event not found.</p>
        <Link to="/" className="text-cascade-purple hover:underline mt-4 inline-block">
          Back to events
        </Link>
      </div>
    )
  }

  const feeDisplay = event.fee_amount === 0 ? 'Free' : `₹${(event.fee_amount / 100).toLocaleString('en-IN')}`
  const isFree = event.fee_amount === 0

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        <div className="aspect-video md:aspect-[21/9] bg-cascade-dark">
          {images.length > 0 ? (
            <EventCarousel images={images} alt={event.name} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cascade-purple/20 to-cascade-dark">
              <Calendar className="w-24 h-24 text-cascade-purple/40" />
            </div>
          )}
        </div>
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span
              className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                isFree ? 'bg-cascade-gold/90 text-cascade-darker' : 'bg-cascade-purple/90 text-white'
              }`}
            >
              {feeDisplay}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{event.name}</h1>
          <p className="text-gray-400 mb-6 whitespace-pre-wrap">{event.description}</p>

          <div className="flex flex-wrap gap-6 text-gray-400 mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cascade-purple" />
              <span>{format(new Date(event.event_date), 'EEEE, MMMM d, yyyy • h:mm a')}</span>
            </div>
            {event.venue && (
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cascade-purple" />
                <span>{event.venue}</span>
              </div>
            )}
            {organizer && (
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-cascade-purple" />
                <span>Organized by {organizer.full_name}</span>
              </div>
            )}
          </div>

          {alreadyRegistered ? (
            <div className="p-4 rounded-xl bg-cascade-purple/10 border border-cascade-purple/30 text-cascade-purple">
              You have already registered for this event. Check your dashboard for status.
            </div>
          ) : user ? (
            <Link
              to={`/events/${eventId}/register`}
              className="btn-primary inline-flex items-center gap-2"
            >
              Register Now
            </Link>
          ) : (
            <Link
              to="/login"
              search={{ from: `/events/${eventId}/register` }}
              className="btn-primary inline-flex items-center gap-2"
            >
              Login to Register
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  )
}
