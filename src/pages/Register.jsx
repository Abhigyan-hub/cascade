import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { createRazorpayOrder } from '../lib/razorpay'
import toast from 'react-hot-toast'
import { useAuth } from '../lib/authContext'
import FormAlert from '../components/FormAlert'
import ConfirmModal from '../components/ConfirmModal'
import { CheckCircle } from 'lucide-react'

function DynamicFormField({ field, register, errors }) {
  const { field_key, field_label, field_type, options, is_required } = field
  // Ensure is_required is a boolean
  const required = is_required === true || is_required === 'true' || is_required === 1

  switch (field_type) {
    case 'textarea':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            {field_label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
          <textarea
            {...register(field_key, { 
              required: required ? `${field_label} is required` : false 
            })}
            className={`input-cascade min-h-[100px] ${errors[field_key] ? 'input-cascade-error' : ''}`}
            placeholder={field_label}
          />
          {errors[field_key] && <p className="text-red-400 text-sm mt-1">{errors[field_key].message || 'Required'}</p>}
        </div>
      )
    case 'select':
      const selectOpts = Array.isArray(options) ? options : (options ? String(options).split(',') : [])
      return (
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            {field_label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
          <select
            {...register(field_key, { 
              required: required ? `${field_label} is required` : false,
              validate: (value) => {
                if (required && (!value || value === '')) {
                  return `${field_label} is required`
                }
                return true
              }
            })}
            className={`input-cascade ${errors[field_key] ? 'input-cascade-error' : ''}`}
          >
            <option value="">Select...</option>
            {selectOpts.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors[field_key] && <p className="text-red-400 text-sm mt-1">{errors[field_key].message || 'Required'}</p>}
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
          <label className="block text-sm font-medium text-gray-400 mb-2">
            {field_label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
          <input
            {...register(field_key, { 
              required: required ? `${field_label} is required` : false 
            })}
            type={field_type === 'email' ? 'email' : field_type === 'number' ? 'number' : 'text'}
            className={`input-cascade ${errors[field_key] ? 'input-cascade-error' : ''}`}
            placeholder={field_label}
          />
          {errors[field_key] && <p className="text-red-400 text-sm mt-1">{errors[field_key].message || 'Required'}</p>}
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
  const [formError, setFormError] = useState('')
  const [pendingData, setPendingData] = useState(null)
  const [success, setSuccess] = useState(null)

  const { register, handleSubmit, formState: { errors }, trigger } = useForm()

  useEffect(() => {
    async function fetch() {
      try {
        const ev = await api(`/api/events/${eventId}`)
        setEvent(ev)
        setFormFields(ev.form_fields || [])
      } catch {
        setEvent(null)
      } finally {
        setLoadingPage(false)
      }
    }
    fetch()
  }, [eventId])

  async function onSubmit(formData) {
    if (!event || !profile || loading) return
    setFormError('')

    const requiredFields = formFields.filter(f => f.is_required === true || f.is_required === 'true')
    const missingFields = []

    for (const field of requiredFields) {
      const value = formData[field.field_key]
      if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        missingFields.push(field.field_label || field.field_key)
      }
    }

    if (missingFields.length > 0) {
      const message = `Please fill all required fields: ${missingFields.join(', ')}`
      setFormError(message)
      toast.error(message)
      await trigger()
      return
    }

    const isPaid = event.fee_amount > 0

    if (isPaid) {
      const frontendKey = import.meta.env.VITE_RAZORPAY_KEY_ID
      if (!frontendKey) {
        const message = 'Payment gateway is not configured. You cannot complete paid registration yet.'
        setFormError(message)
        toast.error(message, { duration: 10000 })
        return
      }
    }

    setPendingData(formData)
  }

  async function confirmSubmit() {
    if (!event || !profile || !pendingData) return
    const formData = pendingData
    const isPaid = event.fee_amount > 0
    setLoading(true)
    setFormError('')

    try {
      const { registration } = await api('/api/registrations', {
        method: 'POST',
        body: JSON.stringify({ event_id: eventId, form_data: formData }),
      })
      setPendingData(null)

      if (isPaid) {
        try {
          await createRazorpayOrder(registration.id, event.fee_amount)
          toast.success('Payment order created. Redirecting to payment page...')
        } catch (err) {
          toast.error(err.message || 'Failed to create payment order. You can retry on the payment page.', {
            duration: 8000,
          })
        }
        navigate({
          to: '/payment',
          search: {
            registration_id: registration.id,
            event_id: eventId,
          },
        })
        return
      }

      toast.success('Registration successful!')
      setSuccess({ eventName: event.name })
    } catch (err) {
      const message = err.message || 'Something went wrong'
      setFormError(message)
      toast.error(message)
      setPendingData(null)
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

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 text-center"
        >
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <FormAlert type="success" title="Registration submitted">
            You are registered for {success.eventName}.
          </FormAlert>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/dashboard" className="btn-primary">
              View dashboard
            </Link>
            <Link to="/" className="btn-secondary">
              Browse events
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

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
          {formError && (
            <FormAlert type="error" title="Could not register">
              {formError}
            </FormAlert>
          )}

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

      <ConfirmModal
        open={!!pendingData}
        title="Submit registration?"
        message={
          event.fee_amount > 0
            ? `You will register for ${event.name} and continue to payment (${feeDisplay}).`
            : `Submit your registration for ${event.name}?`
        }
        confirmLabel={event.fee_amount > 0 ? 'Continue to payment' : 'Submit'}
        loading={loading}
        onConfirm={confirmSubmit}
        onCancel={() => !loading && setPendingData(null)}
      />
    </div>
  )
}
