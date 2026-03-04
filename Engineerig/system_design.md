# system_design.md

# System Design (Multi-User SaaS)
## name: I Shape My Days (IShapeMyDays.in) 


---

## 1. Architecture Overview

Frontend:
- Next.js (App Router, TypeScript)

Backend:
- Supabase PostgreSQL
- Supabase Auth (OTP email login)
- Supabase Edge Functions (email reports)
- Supabase Storage (profile images)

Email Service:
- Resend or Supabase Email (SMTP integration)

Hosting:
- Vercel

---

## 2. Authentication Flow

1. User enters email
2. OTP sent via Supabase
3. User verifies OTP
4. Session created
5. If new user → redirect to profile setup
6. Profile stored in users_profile table

---

## 3. Multi-Tenant Data Design

All tables contain:
- user_id column

Row Level Security:
- SELECT allowed only if user_id = auth.uid()
- INSERT only with matching auth.uid()
- UPDATE only own data
- DELETE only own data

---

## 4. Email Report System

Approach:

Option A (Recommended):
- Supabase Edge Function
- Scheduled cron trigger
- Generate report
- Send email via Resend

Process:
1. Fetch all active users
2. Generate individual reports
3. Send personalized email
4. Store report in reports table

---

## 5. Storage

Profile Images:
- Supabase Storage bucket
- Public or signed URL

---

## 6. Performance Considerations

Now multi-user:
- Add index on user_id for all tables
- Add composite index (user_id + date)
- Optimize report aggregation queries

---

## 7. Scalability

Free tier:
- Suitable for early stage (<5k users)

Future scaling:
- Dedicated Supabase instance
- Background queue for report processing