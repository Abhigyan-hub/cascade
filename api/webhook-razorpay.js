/**
 * Vercel Serverless Function - Razorpay Webhook
 * POST /api/webhook-razorpay
 * Handles payment.captured, payment.authorized etc.
 * Configure this URL in Razorpay Dashboard > Webhooks
 */
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

function verifyWebhookSignature(body, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  return expected === signature
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const signature = req.headers['x-razorpay-signature']
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' })
  }

  // CRITICAL: Use raw body for signature verification
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    return res.status(400).json({ error: 'Invalid webhook signature' })
  }

  const event = typeof req.body === 'object' ? req.body : JSON.parse(req.body)
  const { event: eventType, payload } = event

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  if (eventType === 'payment.captured' || eventType === 'payment.authorized') {
    const paymentEntity = payload.payment?.entity || payload.payment
    const orderId = paymentEntity?.order_id
    const paymentId = paymentEntity?.id

    if (!orderId || !paymentId) {
      return res.status(200).json({ received: true })
    }

    const { data: payment } = await supabase
      .from('payments')
      .select('id, registration_id')
      .eq('razorpay_order_id', orderId)
      .single()

    if (payment && payment.registration_id) {
      await supabase
        .from('payments')
        .update({
          razorpay_payment_id: paymentId,
          status: 'captured',
          verified_at: new Date().toISOString(),
        })
        .eq('id', payment.id)
    }
  }

  return res.status(200).json({ received: true })
}
