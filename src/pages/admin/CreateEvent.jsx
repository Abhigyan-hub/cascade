import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { EVENT_IMAGES_BUCKET } from '../../lib/supabase'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Date' },
]

export default function CreateEvent({ profile }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formFields, setFormFields] = useState([])
  const [images, setImages] = useState([])
  const [imageFiles, setImageFiles] = useState([])

  const [form, setForm] = useState({
    name: '',
    description: '',
    fee_amount: 0,
    event_date: '',
    venue: '',
    max_registrations: '',
    is_published: false,
  })

  function addFormField() {
    setFormFields((f) => [
      ...f,
      {
        id: crypto.randomUUID(),
        field_key: `field_${Date.now()}`,
        field_label: 'New Field',
        field_type: 'text',
        options: null,
        is_required: true,
        sort_order: f.length,
      },
    ])
  }

  function updateFormField(id, updates) {
    setFormFields((f) =>
      f.map((x) => (x.id === id ? { ...x, ...updates } : x))
    )
  }

  function removeFormField(id) {
    setFormFields((f) => f.filter((x) => x.id !== id))
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const valid = files.filter((f) => f.type.startsWith('image/'))
    setImageFiles((prev) => [...prev, ...valid])
  }

  function removeImage(index) {
    setImageFiles((f) => f.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!profile?.id) return

    setLoading(true)
    try {
      const { data: event, error: evError } = await supabase
        .from('events')
        .insert({
          created_by: profile.id,
          name: form.name,
          description: form.description || null,
          fee_amount: Math.round(Number(form.fee_amount) * 100) || 0,
          event_date: form.event_date || null,
          venue: form.venue || null,
          max_registrations: form.max_registrations ? Number(form.max_registrations) : null,
          is_published: form.is_published,
        })
        .select('id')
        .single()

      if (evError) {
        toast.error(evError.message)
        setLoading(false)
        return
      }

      const eventId = event.id

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i]
        const ext = file.name.split('.').pop()
        const path = `${eventId}/${crypto.randomUUID()}.${ext}`
        await supabase.storage.from(EVENT_IMAGES_BUCKET).upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        })
        await supabase.from('event_images').insert({
          event_id: eventId,
          storage_path: path,
          sort_order: i,
        })
      }

      for (let i = 0; i < formFields.length; i++) {
        const f = formFields[i]
        const opts = f.field_type === 'select'
          ? (Array.isArray(f.options) ? f.options : String(f.options || '').split(',').map((x) => x.trim()).filter(Boolean))
          : null
        await supabase.from('event_form_fields').insert({
          event_id: eventId,
          field_key: (f.field_key || `field_${i}`).replace(/\s/g, '_'),
          field_label: f.field_label,
          field_type: f.field_type,
          options: opts,
          is_required: f.is_required,
          sort_order: i,
        })
      }

      toast.success('Event created successfully!')
      navigate('/admin')
    } catch (err) {
      toast.error(err.message || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white mb-8">Create Event</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="card p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white">Basic Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Event Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="input-cascade"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="input-cascade min-h-[120px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Fee (₹) — 0 for free</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.fee_amount}
                  onChange={(e) => setForm((f) => ({ ...f, fee_amount: e.target.value }))}
                  className="input-cascade"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Event Date & Time *</label>
                <input
                  type="datetime-local"
                  value={form.event_date}
                  onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
                  className="input-cascade"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Venue</label>
              <input
                type="text"
                value={form.venue}
                onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                className="input-cascade"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Max Registrations (optional)</label>
              <input
                type="number"
                min={1}
                value={form.max_registrations}
                onChange={(e) => setForm((f) => ({ ...f, max_registrations: e.target.value }))}
                className="input-cascade"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="publish"
                checked={form.is_published}
                onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                className="w-4 h-4 rounded border-cascade-border bg-cascade-dark text-cascade-purple"
              />
              <label htmlFor="publish" className="text-gray-400">Publish event (visible to users)</label>
            </div>
          </div>

          <div className="card p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white">Event Images</h2>
            <div className="flex flex-wrap gap-4">
              {imageFiles.map((file, i) => (
                <div key={i} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="w-24 h-24 rounded-lg border-2 border-dashed border-cascade-border flex items-center justify-center cursor-pointer hover:border-cascade-purple transition-colors">
                <Plus className="w-8 h-8 text-gray-500" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          </div>

          <div className="card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Custom Registration Form</h2>
              <button
                type="button"
                onClick={addFormField}
                className="btn-secondary py-2 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Field
              </button>
            </div>
            <p className="text-gray-500 text-sm">Add fields that registrants must fill for this event.</p>

            <div className="space-y-4">
              {formFields.map((f, idx) => (
                <div
                  key={f.id}
                  className="p-4 rounded-xl bg-cascade-dark border border-cascade-border flex flex-col sm:flex-row gap-4"
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Field label"
                      value={f.field_label}
                      onChange={(e) => updateFormField(f.id, { field_label: e.target.value })}
                      className="input-cascade"
                    />
                    <select
                      value={f.field_type}
                      onChange={(e) => updateFormField(f.id, { field_type: e.target.value })}
                      className="input-cascade"
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    {f.field_type === 'select' && (
                      <input
                        type="text"
                        placeholder="Options (comma-separated)"
                        value={(f.options || []).join(', ')}
                        onChange={(e) =>
                          updateFormField(f.id, {
                            options: e.target.value.split(',').map((x) => x.trim()).filter(Boolean),
                          })
                        }
                        className="input-cascade sm:col-span-2"
                      />
                    )}
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <input
                        type="checkbox"
                        id={`req-${f.id}`}
                        checked={f.is_required}
                        onChange={(e) => updateFormField(f.id, { is_required: e.target.checked })}
                        className="w-4 h-4 rounded border-cascade-border text-cascade-purple"
                      />
                      <label htmlFor={`req-${f.id}`} className="text-gray-400 text-sm">Required</label>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFormField(f.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Event'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
