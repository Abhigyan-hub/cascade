import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  })
}
