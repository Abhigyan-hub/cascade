# CASCADE Event Management Platform

A production-ready event management web application for CASCADE (Department of CSE & AI, GHRSTU). Features dark theme branding, paid/free events, custom registration forms, Razorpay payments, and role-based dashboards.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion
- **Backend:** Supabase (Auth, Database, Storage, RLS)
- **Payments:** Razorpay (India)
- **Deployment:** Vercel

## Features

- **Client:** Browse events, register (free/paid), Razorpay checkout, dashboard with registration status
- **Admin:** Create events, custom forms per event, image carousel, accept/reject registrations
- **Developer/Super Admin:** Full system access, user management, activity logs

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in order (SQL Editor):
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_triggers.sql`
   - `supabase/migrations/004_storage.sql`
3. Create storage bucket `event-images` (or run 004_storage.sql)
4. Copy `.env.example` to `.env.local` and fill:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
```

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
