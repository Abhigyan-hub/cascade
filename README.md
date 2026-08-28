# CASCADE Event Management Platform

A production-ready event management web application for CASCADE (Department of CSE & AI, GHRSTU). Features dark theme branding, paid/free events, custom registration forms, Razorpay payments, and role-based dashboards.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion (deploy on Vercel)
- **API:** Express on EC2
- **Database:** AWS RDS PostgreSQL
- **Images:** Amazon S3
- **Payments:** Razorpay (India)

## Features

- **Client:** Browse events, register (free/paid), Razorpay checkout, dashboard with registration status
- **Admin:** Create events, custom forms per event, image carousel, accept/reject registrations
- **Developer/Super Admin:** Full system access, user list, activity logs

## Local development

### 1. Database

Create a Postgres database (local or RDS) and apply the schema:

```bash
cd backend
cp .env.example .env
# Set DATABASE_URL (for local Postgres without SSL add DATABASE_SSL=false)
npm install
npm run db:init
```

Promote an admin after signup:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
-- or
UPDATE users SET role = 'developer' WHERE email = 'your@email.com';
```

### 2. API (EC2 locally)

In `backend/.env` set `JWT_SECRET`, Razorpay keys, and optionally S3 credentials.

```bash
cd backend
npm run dev
```

API listens on `http://localhost:4000`.

### 3. Frontend

```bash
cp .env.example .env.local
# VITE_API_URL=http://localhost:4000
# VITE_RAZORPAY_KEY_ID=rzp_test_xxx
npm install
npm run dev
```

If `VITE_API_URL` is empty, Vite proxies `/api` to `localhost:4000`.

### 4. Razorpay

1. Create an account at [razorpay.com](https://razorpay.com)
2. Put **Key ID** in `VITE_RAZORPAY_KEY_ID` (frontend) and `RAZORPAY_KEY_ID` (server)
3. Put **Key Secret** only on the server (`RAZORPAY_KEY_SECRET`)
4. Webhook URL: `https://your-ec2-domain/api/payments/webhook`
5. Events: `payment.captured`, `payment.authorized`
6. Set `RAZORPAY_WEBHOOK_SECRET` on the server

See [RAZORPAY_SETUP.md](RAZORPAY_SETUP.md) for dashboard steps.

## AWS backend + frontend on localhost

Use this while you keep Vite on your PC and run the API on EC2.

Full click-path (RDS, security groups, S3, EC2, systemd, `.env.local`): **[docs/AWS_BACKEND_LOCAL_FRONTEND.md](docs/AWS_BACKEND_LOCAL_FRONTEND.md)**.

Short version:

1. RDS Postgres in a private SG (5432 **only from EC2**).
2. EC2 in the **same VPC**, port **4000** and **22** from **your home IP only**.
3. On EC2: copy `backend/`, create `.env`, `npm install --omit=dev`, `npm run db:init`, start with `backend/deploy/cascade-api.service`.
4. On your PC, `.env.local`:

```
VITE_API_URL=http://YOUR_EC2_PUBLIC_IP:4000
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```

5. `npm run dev` → `http://localhost:5173`

`FRONTEND_ORIGIN` on EC2 must include `http://localhost:5173`.

## AWS production (frontend on Vercel later)


1. **RDS:** Postgres 16, private subnet. Security group: allow 5432 **only from the EC2 security group**. Run `backend/db/schema.sql`.
2. **S3:** Bucket for event images. Attach an IAM role to EC2 with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`. Make objects publicly readable or put CloudFront in front and set `S3_PUBLIC_BASE_URL`.
3. **EC2:** Node 20, Nginx reverse proxy (TLS). Copy `backend/`, set env vars, run `npm start` under systemd or PM2.
4. **Vercel:** Build the Vite app. Set `VITE_API_URL=https://api.yourdomain.com` and `VITE_RAZORPAY_KEY_ID`. Set `FRONTEND_ORIGIN` on the API to the Vercel URL (comma-separated if you have preview URLs).

Existing Supabase passwords cannot be migrated. Users must sign up again (or you import emails later and add a reset-password flow).

## Folder Structure

```
cascade/
├── backend/                # Express API (EC2)
│   ├── db/schema.sql
│   └── src/
├── src/                    # React frontend
├── vercel.json
└── package.json
```

## Payment Flow

1. User fills the event registration form
2. API creates a registration (and a pending payment if the event is paid)
3. API creates a Razorpay order
4. User pays in Razorpay Checkout
5. Frontend calls `POST /api/payments/verify`
6. Webhook `POST /api/payments/webhook` syncs captured payments as a backup

## License

Private - CASCADE Department of CSE & AI, GHRSTU
