import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { createRazorpayOrder, openRazorpayCheckout, verifyRazorpayPayment } from '../lib/razorpay'
import toast from 'react-hot-toast'
import { useAuth } from '../lib/authContext'

function DynamicFormField({ field, register, errors }) {
  const { field_key, field_label, field_type, options, is_required } = field

  switch (field_type) {
    case 'textarea':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{field_label}</label>
          <textarea
            {...register(field_key, { required: is_required })}
            className="input-cascade min-h-[100px]"
            placeholder={field_label}
          />
          {errors[field_key] && <p className="text-red-400 text-sm mt-1">Required</p>}
        </div>
      )
    case 'select':
      const selectOpts = Array.isArray(options) ? options : (options ? String(options).split(',') : [])
      return (
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{field_label}</label>
          <select
            {...register(field_key, { required: is_required })}
            className="input-cascade"
          >
            <option value="">Select...</option>
            {selectOpts.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors[field_key] && <p className="text-red-400 text-sm mt-1">Required</p>}
        </div>
      )
    case 'checkbox':
      return (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            {...register(field_key)}
            className="w-4 h-4 rounded border-cascade-border bg-cascade-dark text-cascade-purple focus:ring-cascade-purple"
          />
          <label className="text-sm font-medium text-gray-400">{field_label}</label>
        </div>
      )
    default:
      return (
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{field_label}</label>
          <input
            {...register(field_key, { required: is_required })}
            type={field_type === 'email' ? 'email' : field_type === 'number' ? 'number' : 'text'}
            className="input-cascade"
            placeholder={field_label}
          />
          {errors[field_key] && <p className="text-red-400 text-sm mt-1">Required</p>}
        </div>
      )
  }
}

export default function Register() {
  const { eventId } = useParams({ strict: false })
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [event, setEvent] = useState(null)
  const [formFields, setFormFields] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingPage, setLoadingPage] = useState(true)

  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => {
    async function fetch() {
      const { data: ev, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('is_published', true)
        .single()

      if (error || !ev) {
        setLoadingPage(false)
        return
      }
      setEvent(ev)

      const { data: fields } = await supabase
        .from('event_form_fields')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order')
      setFormFields(fields || [])
      setLoadingPage(false)
    }
    fetch()
  }, [eventId])

  async function onSubmit(formData) {
    if (!event || !profile) return
    setLoading(true)

    try {
      const { data: existing, error: existingError } = await supabase
        .from('registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', profile.id)
        .maybeSingle()

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Error checking existing registration:', existingError)
        toast.error('Error checking registration status')
        setLoading(false)
        return
      }

      if (existing) {
        toast.error('You have already registered for this event.')
        setLoading(false)
        return
      }

      console.log('Inserting registration:', { eventId, userId: profile.id, formData })
      const { data: reg, error: regError } = await supabase
        .from('registrations')
        .insert({
          event_id: eventId,
          user_id: profile.id,
          form_data: formData,
          status: 'pending',
        })
        .select('id')
        .single()

      if (regError) {
        console.error('Registration insert error:', regError)
        toast.error(regError.message || 'Registration failed')
        setLoading(false)
        return
      }

      if (!reg || !reg.id) {
        console.error('Registration insert returned no data')
        toast.error('Registration failed - no confirmation received')
        setLoading(false)
        return
      }

      console.log('Registration successful:', reg.id)

      const isPaid = event.fee_amount > 0

      if (isPaid) {
        const { data: payInsert } = await supabase
          .from('payments')
          .insert({
            registration_id: reg.id,
            amount_paise: event.fee_amount,
            status: 'pending',
          })
          .select('id')
          .single()

        if (payInsert) {
          const apiBase = import.meta.env.VITE_API_URL || window.location.origin
          const createOrderRes = await fetch(`${apiBase}/api/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              registration_id: reg.id,
              amount: event.fee_amount,
              currency: 'INR',
            }),
          })

          if (!createOrderRes.ok) {
            const errData = await createOrderRes.json().catch(() => ({}))
            toast.error(errData.message || 'Could not create payment order')
            setLoading(false)
            return
          }

          const { orderId } = await createOrderRes.json()

          const paymentResponse = await openRazorpayCheckout({
            orderId,
            amount: event.fee_amount,
            name: 'CASCADE Events',
            description: event.name,
            email: profile.email,
          })

          const verifyRes = await fetch(`${apiBase}/api/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              registration_id: reg.id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            }),
          })

          if (!verifyRes.ok) {
            toast.error('Payment verification failed. Please contact support.')
            setLoading(false)
            return
          }
        }
      }

      toast.success(isPaid ? 'Registration and payment successful!' : 'Registration successful!')
      navigate({ to: '/dashboard' })
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (loadingPage) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-cascade-surface rounded w-1/2" />
          <div className="h-48 bg-cascade-surface rounded" />
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Event not found.</p>
        <Link to="/" className="text-cascade-purple hover:underline mt-4 inline-block">
          Back to events
        </Link>
      </div>
    )
  }

  const feeDisplay = event.fee_amount === 0 ? 'Free' : `₹${(event.fee_amount / 100).toLocaleString('en-IN')}`

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 md:p-8"
      >
        <div className="mb-8">
          <Link to={`/events/${eventId}`} className="text-cascade-purple hover:underline text-sm mb-4 inline-block">
            ← Back to event
          </Link>
          <h1 className="text-2xl font-bold text-white">Register for {event.name}</h1>
          <p className="text-gray-500 mt-1">
            Fee: <span className="text-cascade-gold font-semibold">{feeDisplay}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {formFields.map((field) => (
            <DynamicFormField
              key={field.id}
              field={field}
              register={register}
              errors={errors}
            />
          ))}

          {formFields.length === 0 && (
            <p className="text-gray-500">No additional fields for this event.</p>
          )}

          <div className="pt-4">
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading
                ? 'Processing...'
                : event.fee_amount > 0
                ? `Pay ${feeDisplay} & Register`
                : 'Complete Registration'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
