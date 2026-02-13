# Cascade Forum - Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- A Razorpay account with API keys

## Step 1: Clone and Install

```bash
npm install
```

## Step 2: Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor in your Supabase dashboard
3. Run the SQL script from `supabase/schema.sql` to create all tables and policies
4. Get your Supabase URL and anon key from Settings > API

## Step 3: Set Up Razorpay

1. Create a Razorpay account at https://razorpay.com
2. Go to Settings > API Keys
3. Generate API keys (Key ID and Key Secret)
4. Note: Use test keys for development

## Step 4: Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 5: Create Your First Admin/Developer User

After running the schema, you'll need to manually set a user's role to 'admin' or 'developer' in Supabase:

1. Sign up through the website (creates a 'client' role by default)
2. Go to Supabase Dashboard > Table Editor > profiles
3. Find your user and change the `role` field to 'admin' or 'developer'

Alternatively, you can run this SQL in Supabase SQL Editor (replace with your user email):

```sql
UPDATE profiles 
SET role = 'developer' 
WHERE email = 'your-email@example.com';
```

## Step 6: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 7: Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add all environment variables in Vercel project settings
4. Deploy!

## Database Schema Overview

- **profiles**: User profiles with roles (client, admin, developer)
- **events**: Event information with form fields
- **registrations**: User registrations for events
- **payments**: Payment records linked to registrations
- **activity_logs**: Admin action logs

## Role Permissions

### Client
- View events
- Register for events
- View own registrations
- Make payments
- View own history

### Admin
- All client permissions
- Create events
- Create registration forms
- Accept/reject registrations for their events
- View registrations for their events
- Cannot see transaction history

### Developer (Super Admin)
- All admin permissions
- View all users, events, registrations, payments
- View any user profile and full history
- View admin activity logs
- System-wide dashboard
- Can accept/reject any registration

## Troubleshooting

### Razorpay Payment Not Working
- Ensure `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set correctly
- Check that Razorpay keys are active in your Razorpay dashboard
- For test mode, use test keys

### Authentication Issues
- Verify Supabase URL and keys are correct
- Check that RLS policies are enabled in Supabase
- Ensure the profiles table has a row for each authenticated user

### Database Errors
- Run the schema.sql script again if tables are missing
- Check that all foreign key relationships are correct
- Verify RLS policies are set up correctly
