import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CalendarDays, MapPin, Search } from 'lucide-react'

import { api } from '../lib/api'
import EventCard from '../components/EventCard'
import FormAlert from '../components/FormAlert'
import { firstEventImageUrl, sortedEventImages } from '../lib/eventImages'
import { toUserMessage, USER_MESSAGES } from '../lib/userMessage'

export default function Home() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoading(false)
    }, 10000)

    async function fetchEvents() {
      try {
        const data = await api('/api/events')
        setEvents(data || [])
        setLoadError('')
      } catch (error) {
        setLoadError(toUserMessage(error, USER_MESSAGES.loadEvents))
      } finally {
        clearTimeout(timeoutId)
        setLoading(false)
      }
    }

    fetchEvents()
    return () => clearTimeout(timeoutId)
  }, [])

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return events
    return events.filter((event) => {
      const name = event.name?.toLowerCase() || ''
      const description = event.description?.toLowerCase() || ''
      const venue = event.venue?.toLowerCase() || ''
      return name.includes(query) || description.includes(query) || venue.includes(query)
    })
  }, [events, search])

  const searching = Boolean(search.trim())
  const featuredEvent = !searching && !loading ? filteredEvents[0] : null
  const featuredImage = featuredEvent ? firstEventImageUrl(featuredEvent) : ''
  const listedEvents = featuredEvent ? filteredEvents.slice(1) : filteredEvents

  return (
    <main>
      <section className="hero-home">
        <div className="page-container">
          <div
            className={`grid gap-8 lg:gap-12 items-stretch py-14 sm:py-16 lg:py-20 ${
              loading || featuredEvent ? 'lg:grid-cols-2' : ''
            }`}
          >
            <div className="flex flex-col justify-center min-h-[320px] lg:min-h-[380px]">
              <h1 className="hero-title text-4xl sm:text-5xl font-bold leading-[1.12] tracking-tight text-white max-w-xl">
                What is happening
                <span className="rolling-word" aria-label="on campus">
                  <span className="rolling-word-track">
                    <span>on campus</span>
                    <span>this week</span>
                    <span>near you</span>
                    <span>on campus</span>
                  </span>
                </span>
              </h1>
              <p className="mt-5 text-base sm:text-lg text-gray-300 leading-relaxed max-w-xl">
                Workshops, hackathons, competitions, and talks from the Department of CSE &amp; AI
                at GHRSTU. Register and pay in one place.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
                <a href="#events" className="btn-primary">
                  Browse events
                </a>
                <Link to="/faq" className="btn-secondary">
                  How registration works
                </Link>
              </div>
              <p className="mt-8 text-sm text-gray-400">GHRSTU campus · Upcoming events</p>
            </div>

            {loading || featuredEvent ? (
            <div className="min-h-[320px] lg:min-h-[380px]">
              {loading ? (
                <div className="event-hero h-full animate-pulse">
                  <div className="event-hero-image bg-cascade-surface" />
                </div>
              ) : (
                <Link
                  to="/events/$eventId"
                  params={{ eventId: featuredEvent.id }}
                  className="event-hero h-full block group"
                >
                  {featuredImage ? (
                    <img
                      src={featuredImage}
                      alt=""
                      className="event-hero-image"
                    />
                  ) : (
                    <div className="event-hero-image flex items-center justify-center bg-cascade-surface">
                      <CalendarDays className="w-10 h-10 text-gray-600" />
                    </div>
                  )}
                  <div className="event-hero-overlay" />
                  <div className="event-hero-content">
                    <p className="event-status event-status-open mb-3">Next up</p>
                    <h2 className="text-2xl font-semibold text-white leading-tight">
                      {featuredEvent.name}
                    </h2>
                    {featuredEvent.venue ? (
                      <p className="flex items-center gap-2 mt-3 text-sm text-gray-200">
                        <MapPin className="w-4 h-4 shrink-0" />
                        {featuredEvent.venue}
                      </p>
                    ) : null}
                    <span className="mt-5 inline-block text-sm font-semibold text-white">
                      View event
                    </span>
                  </div>
                </Link>
              )}
            </div>
            ) : null}
          </div>
        </div>
      </section>

      <section id="events" className="page-section events-section">
        <div className="page-container">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="section-heading">Upcoming events</h2>
              <p className="section-description">Find an event and register.</p>
            </div>
            {!loading && events.length > 0 ? (
              <div className="relative w-full md:w-80 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or venue"
                  className="input-cascade pl-10"
                  aria-label="Search events"
                />
              </div>
            ) : null}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="event-card animate-pulse">
                  <div className="event-card-media bg-cascade-dark" />
                  <div className="event-card-body space-y-3">
                    <div className="h-6 bg-cascade-dark rounded w-3/4" />
                    <div className="h-4 bg-cascade-dark rounded w-1/2" />
                    <div className="h-10 bg-cascade-dark rounded mt-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="max-w-xl mx-auto py-10 text-center">
              <FormAlert type="error" title="Could not load events">
                {loadError}
              </FormAlert>
              <button type="button" className="btn-primary mt-6" onClick={() => window.location.reload()}>
                Refresh
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="empty-state">
              <CalendarDays className="w-9 h-9 text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-white">
                {searching ? 'No events found' : 'No events yet'}
              </h3>
              <p className="text-sm text-gray-400 mt-2 max-w-md">
                {searching
                  ? 'Try another name or venue.'
                  : 'New events will appear here when they are published.'}
              </p>
              {searching ? (
                <button type="button" className="btn-secondary mt-5" onClick={() => setSearch('')}>
                  Clear search
                </button>
              ) : null}
            </div>
          ) : listedEvents.length === 0 ? (
            <p className="text-sm text-gray-400">This is the only event right now. Open it from the highlight above.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {listedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  images={sortedEventImages(event)}
                  organizer={event.profiles}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-cascade-border">
        <div className="page-container">
          <div className="grid sm:grid-cols-3 gap-8 sm:gap-10 py-14">
            <div>
              <h3 className="font-semibold text-white">Find events</h3>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                Browse what CASCADE has published for campus.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">Register</h3>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                Submit the event form and pay with Razorpay when there is a fee.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">Track status</h3>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                See accept, reject, and payment state on your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
