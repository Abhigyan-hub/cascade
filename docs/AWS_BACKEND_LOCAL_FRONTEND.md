# AWS backend + localhost frontend

Keep Vite on your PC (`http://localhost:5173`). Put Postgres, the Express API, and images on AWS.

```
Browser (localhost:5173)
        |  VITE_API_URL
        v
EC2 Express (:4000)  -->  RDS Postgres
                     -->  S3 (event images)
                     -->  Razorpay
```

Do **not** open RDS to the whole internet. Only the EC2 security group should reach port 5432.

If a real database password was ever pasted into `backend/.env.example` or chat, rotate it in the RDS console (Modify → change master password) and update `.env` on EC2 only.

## 0. Region

Use one region for RDS, EC2, and S3 (example: `eu-north-1` / Stockholm).

## 1. RDS (skip if the instance already exists)

1. AWS Console → **RDS** → **Create database**.
2. Standard create → **PostgreSQL** 16 → Free tier / Burstable if you are testing.
3. Set master username + a strong password (password manager, not git).
4. **Initial database name:** `cascade`.
5. VPC: default is fine for a first setup.
6. **Public access: No** (the API on EC2 connects; your laptop does not).
7. VPC security group: create `cascade-rds-sg`. Inbound: **PostgreSQL 5432** from `cascade-ec2-sg` only (create that SG in step 2 first, or edit this rule after EC2 exists).
8. Create. Wait until **Available**. Copy the endpoint, like `xxxx.region.rds.amazonaws.com`.

## 2. Security groups

**`cascade-ec2-sg` inbound**

| Type | Port | Source | Why |
|------|------|--------|-----|
| Custom TCP | 4000 | Your home public IP `/32` | Laptop → API |
| SSH | 22 | Your home public IP `/32` | Deploy |

Find your IP: [https://checkip.amazonaws.com](https://checkip.amazonaws.com).

**`cascade-rds-sg` inbound**

| Type | Port | Source |
|------|------|--------|
| PostgreSQL | 5432 | `cascade-ec2-sg` |

Outbound on both: default allow-all is fine.

## 3. S3 bucket

1. **S3** → Create bucket `cascade-event-images` (name must be globally unique; add a suffix if taken).
2. Same region as RDS.
3. Uncheck “Block all public access” **only if** you will use public object URLs. Confirm the warning. (Safer later: CloudFront + private bucket.)
4. Bucket → **Permissions** → **Bucket policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadEventImages",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::cascade-event-images/events/*"
    }
  ]
}
```

5. **IAM** → Roles → Create role → AWS service → **EC2**. Attach a new policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::cascade-event-images/events/*"
    }
  ]
}
```

Name the role `cascade-ec2-role`. You will attach it to the instance.

## 4. EC2

1. **EC2** → Launch instance.
2. Amazon Linux 2023, t3.micro (or t3.small).
3. Key pair: create/download `.pem` (you need it for SSH from Windows).
4. Network: **same VPC as RDS**. Subnet: public subnet (auto-assign public IP).
5. Security group: `cascade-ec2-sg`.
6. Advanced → **IAM instance profile:** `cascade-ec2-role`.
7. Launch. Copy **Public IPv4**.

SSH (PowerShell, path to your key):

```powershell
ssh -i "$HOME\Downloads\your-key.pem" ec2-user@YOUR_EC2_PUBLIC_IP
```

If Windows complains about the key:

```powershell
icacls "$HOME\Downloads\your-key.pem" /inheritance:r
icacls "$HOME\Downloads\your-key.pem" /grant:r "$($env:USERNAME):(R)"
```

On the instance:

```bash
sudo dnf update -y
sudo dnf install -y nodejs git
node -v   # need 18+; Amazon Linux 2023 is usually 20+

# copy the repo (or git clone your GitHub remote)
mkdir -p ~/cascade
# from your PC, in a second terminal:
# scp -i your-key.pem -r backend ec2-user@YOUR_EC2_PUBLIC_IP:~/

cd ~/backend
npm install --omit=dev
nano .env
```

Put this in `/home/ec2-user/backend/.env` (values only on the instance):

```
PORT=4000
HOST=0.0.0.0
DATABASE_URL=postgres://MASTERUSER:URLENCODED_PASSWORD@RDS_ENDPOINT:5432/cascade
JWT_SECRET=long-random-string
FRONTEND_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
AWS_REGION=eu-north-1
S3_BUCKET=cascade-event-images
```

If the DB password contains `@`, `#`, or `/`, URL-encode it in `DATABASE_URL`.

Apply schema (from EC2, so it can reach RDS):

```bash
cd ~/backend
npm run db:init
```

Run:

```bash
sudo cp deploy/cascade-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now cascade-api
sudo systemctl status cascade-api
curl -s http://127.0.0.1:4000/api/health
```

From your laptop:

```powershell
curl http://YOUR_EC2_PUBLIC_IP:4000/api/health
```

You should see `{"ok":true}`. If it times out, the instance SG is not allowing **your** IP on port 4000.

## 5. Local frontend

In the project root `.env.local` (not committed):

```
VITE_API_URL=http://YOUR_EC2_PUBLIC_IP:4000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxx
```

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`. Sign up. Then on EC2:

```bash
# if psql is not installed: sudo dnf install -y postgresql15
psql "$DATABASE_URL" -c "UPDATE users SET role = 'developer' WHERE email = 'you@email.com';"
```

Or any SQL client that you run **on EC2** (not from home unless RDS is public).

## 6. Razorpay webhook (optional until you test paid events)

Dashboard → Webhooks → `http://YOUR_EC2_PUBLIC_IP:4000/api/payments/webhook`  
(Use HTTPS later; Razorpay may require HTTPS in live mode.)

## Checklist

- [ ] RDS and EC2 in the same VPC
- [ ] 5432 only from EC2 SG
- [ ] 4000 and 22 only from your home IP
- [ ] `npm run db:init` succeeded on EC2
- [ ] `curl` health from laptop works
- [ ] `.env.local` `VITE_API_URL` is the EC2 URL (no trailing slash)
- [ ] IAM role on EC2 for S3 (no keys in git)
- [ ] RDS password not in GitHub
