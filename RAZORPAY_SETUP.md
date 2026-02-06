# Razorpay Payment Gateway Setup Guide

## Step 1: Create Razorpay Account

1. Go to [https://razorpay.com](https://razorpay.com)
2. Click **"Sign Up"** and create an account
3. Complete the KYC verification (required for live payments)
4. For testing, you can use **Test Mode** without KYC

## Step 2: Get Your API Keys

### For Test Mode (Development):
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to **Settings** → **API Keys**
3. Click **"Generate Test Key"** if you don't have one
4. You'll get:
   - **Key ID** (starts with `rzp_test_...`)
   - **Key Secret** (starts with `rzp_test_...`)

### For Live Mode (Production):
1. Complete KYC verification
2. Go to **Settings** → **API Keys**
3. Click **"Generate Live Key"**
4. You'll get:
   - **Key ID** (starts with `rzp_live_...`)
   - **Key Secret** (starts with `rzp_live_...`)

## Step 3: Set Up Environment Variables

### For Local Development:

Create a `.env` file in your project root:

```env
# Razorpay Configuration (Frontend)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx

# Razorpay Configuration (Backend - for API routes)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_key_secret_here

# Razorpay Webhook Secret (get this after setting up webhook)
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Supabase Configuration (if not already set)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Service Role Key (for backend API routes)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### For Vercel Deployment:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add all the variables listed above:
   - `VITE_RAZORPAY_KEY_ID` (for frontend)
   - `RAZORPAY_KEY_ID` (for backend)
   - `RAZORPAY_KEY_SECRET` (for backend)
   - `RAZORPAY_WEBHOOK_SECRET` (for webhooks)
   - `VITE_SUPABASE_URL` (if not already set)
   - `SUPABASE_SERVICE_ROLE_KEY` (if not already set)

**Important:** 
- Variables starting with `VITE_` are exposed to the frontend
- Variables without `VITE_` are only available in serverless functions
- Make sure to set them for all environments (Production, Preview, Development)

## Step 4: Install Razorpay Package

Make sure the Razorpay package is installed:

```bash
npm install razorpay
```

## Step 5: Configure Webhook (Optional but Recommended)

Webhooks allow Razorpay to notify your server about payment status changes.

1. In Razorpay Dashboard, go to **Settings** → **Webhooks**
2. Click **"Add New Webhook"**
3. Set the webhook URL:
   - **Local:** `http://localhost:3000/api/webhook-razorpay` (if using local dev server)
   - **Production:** `https://cascade-wine-gamma.vercel.app/api/webhook-razorpay`
4. Select events to listen for:
   - `payment.captured`
   - `payment.authorized`
5. Copy the **Webhook Secret** and add it to your `.env` as `cascade-wine-gamma.vercel.app`
6. Click **"Save"**

## Step 6: Test the Integration

### Test Mode:
1. Use test API keys (starting with `rzp_test_`)
2. Use Razorpay test cards:
   - **Card Number:** `4111 1111 1111 1111`
   - **CVV:** Any 3 digits (e.g., `123`)
   - **Expiry:** Any future date (e.g., `12/25`)
   - **Name:** Any name

### Test Flow:
1. Create an event with a fee (e.g., ₹100)
2. Register for the event
3. Click "Pay & Register"
4. Use test card details
5. Payment should complete successfully

## Troubleshooting

### "Payment gateway not configured" Error:
- Check that `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set in environment variables
- Make sure you're using the correct keys (test vs live)
- Restart your dev server after adding `.env` variables

### Payment Not Processing:
- Check browser console for errors
- Verify `VITE_RAZORPAY_KEY_ID` is set correctly
- Make sure Razorpay script is loading (check Network tab)

### Webhook Not Working:
- Verify webhook URL is correct
- Check that `RAZORPAY_WEBHOOK_SECRET` matches the one in Razorpay dashboard
- Check Vercel function logs for errors

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` file to git
- Never expose `RAZORPAY_KEY_SECRET` in frontend code
- Use test keys for development
- Switch to live keys only in production
- Keep webhook secret secure

## Quick Checklist

- [ ] Razorpay account created
- [ ] API keys generated (test or live)
- [ ] Environment variables set in `.env` (local) or Vercel (production)
- [ ] `razorpay` package installed
- [ ] Webhook configured (optional)
- [ ] Test payment completed successfully

## Support

- Razorpay Docs: https://razorpay.com/docs/
- Razorpay Dashboard: https://dashboard.razorpay.com
- Test Cards: https://razorpay.com/docs/payments/test-cards/
