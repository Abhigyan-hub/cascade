import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, User, IndianRupee } from 'lucide-react'
import { format } from 'date-fns'
import EventCarousel from './EventCarousel'

export default function EventCard({ event, images = [], organizer }) {
  const feeDisplay = event.fee_amount === 0 ? 'Free' : `₹${(event.fee_amount / 100).toLocaleString('en-IN')}`
  const isFree = event.fee_amount === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card overflow-hidden group"
    >
      <div className="aspect-video bg-cascade-dark relative overflow-hidden">
        {images?.length > 0 ? (
          <EventCarousel images={images} alt={event.name} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cascade-purple/20 to-cascade-dark">
            <Calendar className="w-16 h-16 text-cascade-purple/40" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              isFree
                ? 'bg-cascade-gold/90 text-cascade-darker'
                : 'bg-cascade-purple/90 text-white'
            }`}
          >
            {feeDisplay}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-lg text-white group-hover:text-cascade-purple-light transition-colors line-clamp-2 mb-2">
          {event.name}
        </h3>
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>{format(new Date(event.event_date), 'MMM d, yyyy • h:mm a')}</span>
        </div>
        {organizer && (
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
            <User className="w-4 h-4 flex-shrink-0" />
            <span>by {organizer.full_name}</span>
          </div>
        )}
        <Link
          to={`/events/${event.id}`}
          className="btn-primary inline-flex items-center gap-2 w-full justify-center py-2.5"
        >
          View Details
        </Link>
      </div>
    </motion.div>
  )
}
