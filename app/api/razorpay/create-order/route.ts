import { NextRequest, NextResponse } from 'next/server'
import { createRazorpayOrder } from '@/lib/razorpay'
import { supabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { amount, payment_id } = await request.json()

    const order = await createRazorpayOrder(amount, 'INR')

    // Update payment with order ID
    await supabaseAdmin
      .from('payments')
      .update({ razorpay_order_id: order.id })
      .eq('id', payment_id)

    return NextResponse.json({ order })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
