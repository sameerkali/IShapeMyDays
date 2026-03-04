# database_schema.md

# Multi-User Database Schema

---

## 1. profiles

| Field | Type |
|-------|------|
| id | uuid (PK, matches auth.uid) |
| name | text |
| image_url | text |
| email | text |
| phone | text |
| profession | text |
| bio | text |
| goal | text |
| created_at | timestamp |

---

## 2. categories

| Field | Type |
|-------|------|
| id | uuid |
| user_id | uuid |
| name | text |
| icon | text |
| color | text |
| order | integer |
| active | boolean |
| created_at | timestamp |

INDEX: user_id

---

## 3. habits

Add index:
INDEX (user_id, category_id)

---

## 4. habit_entries

Add:
INDEX (user_id, entry_date)

---

## 5. food_logs

Add:
INDEX (user_id, created_at)

---

## 6. reports

No change except:
INDEX (user_id, type)