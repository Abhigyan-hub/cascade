import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/razorpay'
import { supabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_id,
    } = await request.json()

    const isValid = verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid signature' })
    }

    // Update payment record
    const { error: payError } = await supabaseAdmin
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'completed',
      })
      .eq('id', payment_id)

    if (payError) throw payError

    // Update registration payment status
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('registration_id')
      .eq('id', payment_id)
      .single()

    if (payment) {
      await supabaseAdmin
        .from('registrations')
        .update({ payment_status: 'completed' })
        .eq('id', payment.registration_id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
