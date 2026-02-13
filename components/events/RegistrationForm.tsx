'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Event, FormField } from '@/lib/supabase/types'

interface RegistrationFormProps {
  event: Event
  onSuccess: () => void
  onCancel: () => void
}

export default function RegistrationForm({ event, onSuccess, onCancel }: RegistrationFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be signed in to register')
      setLoading(false)
      return
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from('registrations')
      .select('id')
      .eq('event_id', event.id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      setError('You are already registered for this event')
      setLoading(false)
      return
    }

    // Create registration
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .insert({
        event_id: event.id,
        user_id: user.id,
        status: 'pending',
        form_data: formData,
        payment_status: event.is_paid ? 'pending' : 'completed',
      })
      .select()
      .single()

    if (regError) {
      setError(regError.message)
      setLoading(false)
      return
    }

    // If paid event, redirect to payment
    if (event.is_paid) {
      router.push(`/payments/${registration.id}`)
      return
    }

    onSuccess()
  }

  function handleFieldChange(fieldId: string, value: string) {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registration Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {event.form_fields.map((field: FormField) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {field.type === 'textarea' ? (
                <Textarea
                  id={field.id}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  required={field.required}
                />
              ) : field.type === 'select' ? (
                <Select
                  id={field.id}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  required={field.required}
                >
                  <option value="">Select an option</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  id={field.id}
                  type={field.type}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  required={field.required}
                />
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Submitting...' : 'Submit Registration'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
