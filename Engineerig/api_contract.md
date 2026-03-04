# api_contract.md

# API Contract (Multi-User)

All endpoints require authenticated session.

---

## Auth

POST /auth/otp
POST /auth/verify

---

## Profile

GET /profile
POST /profile
PATCH /profile

---

## Categories

GET /categories
POST /categories
PATCH /categories/:id
DELETE /categories/:id

---

## Habits

GET /habits
POST /habits
PATCH /habits/:id
DELETE /habits/:id

---

## Habit Entries

GET /habit-entries?date=
POST /habit-entries
PATCH /habit-entries/:id
DELETE /habit-entries/:id

---

## Food Logs

GET /food-logs?date=
POST /food-logs
PATCH /food-logs/:id
DELETE /food-logs/:id

---

## Reports

GET /reports