# PRD.md
# Product Requirements Document
## Product: Productivity Tracker SaaS
## name: I Shape My Days (IShapeMyDays.in) 
---

## 1. Purpose

Build a multi-user productivity tracking web application where any user can:

- Sign up using Email + OTP authentication
- Create and manage categories and habits
- Track calories and personal growth
- Receive automated weekly and monthly reports via email

This is now a SaaS application, not a single-user system.

---

## 2. Target Users

- Students
- Developers
- Fitness-focused individuals
- Self-improvement focused professionals
- Anyone wanting structured habit tracking

---

## 3. Authentication Requirements

Login Method:
- Email-based OTP (passwordless)
- OTP required every login

After first login:
- User must complete profile setup

Profile Fields:
- name (required)
- image (optional)
- email (required)
- phone (optional)
- profession (optional)
- bio (optional)
- goal (short description of personal objective)

---

## 4. Core Features (Updated Scope)

All previous tracking features remain the same but now scoped per user.

Each user has:
- Their own categories
- Their own habits
- Their own logs
- Their own reports
- Their own calorie targets

No shared data between users.

---

## 5. Email Reporting

Weekly Report:
- Generated automatically every Sunday
- Sent to user email
- Also stored in dashboard

Monthly Report:
- Generated last day of month
- Sent via email
- Dashboard accessible

Email Content Includes:
- Completion %
- Best streak
- Most improved habit
- Category performance
- Weekly/Monthly score

---

## 6. Data Privacy

- Strict user isolation
- RLS enforced
- No cross-user visibility
- User can delete account and all associated data

---

## 7. Success Metrics

- Signup conversion rate
- Weekly active users
- Email open rate
- Habit retention over 30 days