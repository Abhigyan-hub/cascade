# Razorpay Payment Gateway Setup Guide

## Step 1: Create Razorpay Account

1. Go to [https://razorpay.com](https://razorpay.com)
2. Click **Sign Up** and create an account
3. Complete KYC for live payments
4. For testing, use **Test Mode** without KYC

## Step 2: Get Your API Keys

In [Razorpay Dashboard](https://dashboard.razorpay.com) → **Settings** → **API Keys**:

- Test Key ID starts with `rzp_test_`
- Live Key ID starts with `rzp_live_`

## Step 3: Environment variables

**Frontend** (`.env.local` / Vercel):

```env
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
VITE_API_URL=http://localhost:4000
```

**API** (`backend/.env` / EC2):

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

`VITE_API_URL` must be your EC2 API origin in production (for example `https://api.yourdomain.com`).

## Step 4: Webhook

1. Razorpay Dashboard → **Settings** → **Webhooks**
2. URL: `https://your-ec2-domain/api/payments/webhook`
3. Events: `payment.captured`, `payment.authorized`
4. Copy the webhook secret into `RAZORPAY_WEBHOOK_SECRET`

## Step 5: Test

Use test card `4111 1111 1111 1111`, any future expiry, any CVV.

1. Create a paid event
2. Register and complete checkout
3. Confirm the payment shows as captured on the dashboard

## Security

- Never commit `.env` files
- Never put `RAZORPAY_KEY_SECRET` in the frontend
- Use test keys in development
