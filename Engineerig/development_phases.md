# development_phases.md

# Development Phases (SaaS Version)
## name: I Shape My Days (IShapeMyDays.in) 

---

## Phase 1 – Authentication & Profiles

- Supabase OTP login
- Profile setup screen
- RLS enforcement
- Multi-user table structure

Deliverable:
Users can sign up and log in securely.

---

## Phase 2 – Core Tracking

Same as before but scoped per user.

---

## Phase 3 – Email Integration

- Integrate Resend
- Create email templates
- Build Edge Function for weekly report
- Cron scheduling

Deliverable:
Users receive weekly email.

---

## Phase 4 – Scaling & Optimization

- Index optimization
- Query performance
- Email batching logic