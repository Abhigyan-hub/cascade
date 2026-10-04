import { Link } from '@tanstack/react-router'
import { Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import EventCarousel from './EventCarousel'

import { eventImageUrl, sortedEventImages } from '../lib/eventImages'

export default function EventCard({ event, images = [], organizer }) {
  const feeDisplay =
    event.fee_amount === 0
      ? 'Free'
      : `₹${(event.fee_amount / 100).toLocaleString('en-IN')}`

  const isFree = event.fee_amount === 0
  const cardImages = images.length ? images : sortedEventImages(event)
  const hasImage = cardImages.some(eventImageUrl)

  return (
    <article className="event-card">
      {/* Event image */}
      <div className="event-card-media">
        {hasImage ? (
          <EventCarousel
            images={cardImages}
            alt={event.name}
          />
        ) : (
          <div className="event-card-placeholder">
            <Calendar className="w-10 h-10 text-gray-600" />
          </div>
        )}

        {/* Fee */}
        <span
          className={`event-fee ${
            isFree ? 'event-fee-free' : 'event-fee-paid'
          }`}
        >
          {feeDisplay}
        </span>
      </div>

      {/* Content */}
      <div className="event-card-body">

        <h3 className="event-card-title">
          {event.name}
        </h3>

        <div className="event-card-info">
          <div>
            <Calendar />
            <span>
              {format(
                new Date(event.event_date),
                'MMM d, yyyy • h:mm a'
              )}
            </span>
          </div>

          {organizer && (
            <div>
              <User />
              <span>by {organizer.full_name}</span>
            </div>
          )}
        </div>

        <Link
          to="/events/$eventId"
          params={{ eventId: event.id }}
          className="event-card-button"
        >
          View Details
        </Link>

      </div>
    </article>
  )
}