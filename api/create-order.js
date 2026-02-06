/**
 * Vercel Serverless Function - Create Razorpay Order
 * POST /api/create-order
 */
import Razorpay from 'razorpay'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { registration_id, amount, currency = 'INR' } = req.body || {}

  if (!registration_id || !amount || amount < 100) {
    return res.status(400).json({ message: 'Invalid registration_id or amount (min ₹1)' })
  }

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    console.error('Razorpay credentials not configured', {
      hasKeyId: !!keyId,
      hasKeySecret: !!keySecret,
      envKeys: Object.keys(process.env).filter(k => k.includes('RAZORPAY'))
    })
    return res.status(500).json({ 
      message: 'Payment gateway not configured on backend. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel environment variables. See RAZORPAY_SETUP.md for instructions.',
      details: {
        missingKeyId: !keyId,
        missingKeySecret: !keySecret
      }
    })
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ message: 'Server configuration error' })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: payment } = await supabase
      .from('payments')
      .select('id')
      .eq('registration_id', registration_id)
      .eq('status', 'pending')
      .single()

    if (!payment) {
      return res.status(400).json({ message: 'No pending payment found for this registration' })
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency,
      receipt: `reg_${registration_id}`,
      notes: { registration_id },
    })

    await supabase
      .from('payments')
      .update({ razorpay_order_id: order.id })
      .eq('id', payment.id)

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (error) {
    console.error('Razorpay order creation error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create payment order'
    if (error.message?.includes('Invalid key') || error.message?.includes('authentication')) {
      errorMessage = 'Invalid Razorpay API keys. Please check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel environment variables.'
    } else if (error.message?.includes('Network') || error.message?.includes('ECONNREFUSED')) {
      errorMessage = 'Network error connecting to Razorpay. Please check your internet connection and try again.'
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Request to Razorpay timed out. Please try again.'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return res.status(500).json({
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        hasKeyId: !!keyId,
        hasKeySecret: !!keySecret,
        errorType: error.constructor?.name,
      } : undefined,
    })
  }
}
