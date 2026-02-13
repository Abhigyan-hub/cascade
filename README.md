# Cascade Forum Committee Website

A comprehensive event management system for Cascade Forum with role-based access control.

## Features

### Client (End User)
- View all events
- Register for free or paid events
- View registration status (Pending/Accepted/Rejected)
- Make payments for paid events
- View registration history

### Admin
- Create events and registration forms
- Accept or reject registrations
- View events they created (with name displayed)
- No access to transaction history

### Developer (Super Admin)
- View all users, events, payments, and registrations
- Open any user profile and view full history
- View admin activity logs
- System-wide dashboard
- Can accept/reject any form

## Tech Stack

- **Frontend**: Next.js 16 (App Router)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Payment**: Razorpay
- **UI**: Custom components with Cascade Forum branding
- **Deployment**: Vercel

## Quick Start

See [SETUP.md](./SETUP.md) for detailed setup instructions.

1. Install dependencies: `npm install`
2. Set up Supabase database (run `supabase/schema.sql`)
3. Configure environment variables (see `.env.example`)
4. Run development server: `npm run dev`

## Environment Variables

Required environment variables (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `RAZORPAY_KEY_ID` - Your Razorpay key ID (server-side)
- `RAZORPAY_KEY_SECRET` - Your Razorpay key secret (server-side)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Your Razorpay key ID (client-side)
- `NEXT_PUBLIC_APP_URL` - Your application URL

<<<<<<< HEAD
For detailed setup instructions, see [SETUP.md](./SETUP.md).
=======
### 3. Razorpay Setup

1. Create account at [razorpay.com](https://razorpay.com)
2. Get Key ID and Secret from Dashboard
3. Add webhook: `https://your-domain.com/api/webhook-razorpay`
4. Select events: `payment.captured`, `payment.authorized`
5. Set webhook secret in env

### 4. Create First Admin

Sign up a user, then in Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

For super admin:

```sql
UPDATE profiles SET role = 'developer' WHERE email = 'your@email.com';
```

### 5. Run Locally

```bash
npm run dev
```

For payment APIs locally, use [Vercel CLI](https://vercel.com/cli):

```bash
vercel dev
```

### 6. Deploy to Vercel

```bash
vercel
```

Add all env vars in Vercel project settings. 

**About VITE_API_URL:**
- **Leave it empty** if your frontend and API are on the same Vercel deployment (most common case)
- **Only set it** if your API serverless functions are on a completely different domain
- If empty, the app will automatically use `window.location.origin` (current domain)
- Example: `VITE_API_URL=https://your-api-domain.com` (only if different from frontend)

## Folder Structure

```
cascade/
├── api/                    # Vercel serverless (Razorpay)
│   ├── create-order.js
│   ├── verify-payment.js
│   └── webhook-razorpay.js
├── public/
├── src/
│   ├── components/         # UI components
│   ├── lib/                # Supabase, auth, Razorpay
│   ├── pages/              # Route pages
│   │   ├── dashboard/      # Client, Admin, Developer
│   │   └── admin/          # Create/Edit event, Registrations
│   └── App.jsx
├── supabase/
│   └── migrations/         # SQL schema, RLS, triggers
├── vercel.json
└── package.json
```

## Payment Flow

1. User fills event-specific registration form
2. Registration record created (status: pending)
3. If paid: Payment record created, Razorpay order created via API
4. User completes payment in Razorpay Checkout
5. Frontend calls `/api/verify-payment` with payment details
6. Backend verifies signature, updates payment to `captured`
7. Webhook optionally syncs for reliability

## License

Private - CASCADE Department of CSE & AI, GHRSTU
>>>>>>> 1845322e70ebf88b2339b048efa29f4d0eaa0608
