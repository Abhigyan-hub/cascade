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

For detailed setup instructions, see [SETUP.md](./SETUP.md).
