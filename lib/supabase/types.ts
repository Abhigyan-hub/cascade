export type UserRole = 'client' | 'admin' | 'developer'

export interface User {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
}

export interface Event {
  id: string
  title: string
  description: string
  event_date: string
  registration_deadline: string
  is_paid: boolean
  price: number | null
  created_by: string
  created_by_name: string
  created_at: string
  form_fields: FormField[]
}

export interface FormField {
  id: string
  label: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'number'
  required: boolean
  options?: string[]
}

export interface Registration {
  id: string
  event_id: string
  user_id: string
  status: 'pending' | 'accepted' | 'rejected'
  form_data: Record<string, any>
  payment_id: string | null
  payment_status: 'pending' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  event?: Event
  user?: User
}

export interface Payment {
  id: string
  registration_id: string
  amount: number
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  razorpay_signature: string | null
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  registration?: Registration
}

export interface ActivityLog {
  id: string
  admin_id: string
  admin_name: string
  action: 'approve' | 'reject' | 'create_event' | 'update_event'
  target_type: 'registration' | 'event'
  target_id: string
  details: Record<string, any>
  created_at: string
}
