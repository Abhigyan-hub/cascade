'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField } from '@/lib/supabase/types'

export default function CreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    registration_deadline: '',
    is_paid: false,
    price: '',
  })

  function addFormField() {
    setFormFields([
      ...formFields,
      {
        id: `field_${Date.now()}`,
        label: '',
        type: 'text',
        required: false,
      },
    ])
  }

  function updateFormField(index: number, updates: Partial<FormField>) {
    setFormFields(
      formFields.map((field, i) => (i === index ? { ...field, ...updates } : field))
    )
  }

  function removeFormField(index: number) {
    setFormFields(formFields.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be signed in')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const { error: eventError } = await supabase
      .from('events')
      .insert({
        title: formData.title,
        description: formData.description,
        event_date: formData.event_date,
        registration_deadline: formData.registration_deadline,
        is_paid: formData.is_paid,
        price: formData.is_paid ? parseFloat(formData.price) : null,
        created_by: user.id,
        created_by_name: profile?.full_name || user.email || 'Admin',
        form_fields: formFields,
      })

    if (eventError) {
      setError(eventError.message)
      setLoading(false)
      return
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      admin_id: user.id,
      admin_name: profile?.full_name || user.email || 'Admin',
      action: 'create_event',
      target_type: 'event',
      target_id: user.id, // Will be updated after event creation
      details: { title: formData.title },
    })

    router.push('/admin/events')
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Create New Event</CardTitle>
          <CardDescription>
            Fill in the details to create a new event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_date">Event Date *</Label>
                <Input
                  id="event_date"
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registration_deadline">Registration Deadline *</Label>
                <Input
                  id="registration_deadline"
                  type="datetime-local"
                  value={formData.registration_deadline}
                  onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_paid"
                  checked={formData.is_paid}
                  onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_paid">This is a paid event</Label>
              </div>

              {formData.is_paid && (
                <div className="space-y-2">
                  <Label htmlFor="price">Price (INR) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required={formData.is_paid}
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Registration Form Fields</Label>
                <Button type="button" variant="outline" onClick={addFormField}>
                  Add Field
                </Button>
              </div>

              {formFields.map((field, index) => (
                <Card key={field.id}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Field Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateFormField(index, { label: e.target.value })}
                          placeholder="e.g., Full Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Field Type</Label>
                        <select
                          value={field.type}
                          onChange={(e) => updateFormField(index, { type: e.target.value as any })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="email">Email</option>
                          <option value="phone">Phone</option>
                          <option value="textarea">Textarea</option>
                          <option value="select">Select</option>
                          <option value="number">Number</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateFormField(index, { required: e.target.checked })}
                          className="rounded"
                        />
                        <Label>Required</Label>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeFormField(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creating...' : 'Create Event'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
