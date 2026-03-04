# MVP_tech_doc.md

# MVP Technical Documentation
## name: I Shape My Days (IShapeMyDays.in) 

---

## MVP Scope

Focus only on:

- Auth
- Category CRUD
- Habit CRUD
- Boolean + Duration tracking
- Daily logging
- Basic calorie logging
- Simple line chart
- Weekly summary (basic version)

Exclude:
- Radar chart
- Monthly advanced insights
- Image uploads (initially)
- Archive logic
- Export system

---

## Minimal Database Tables

- categories
- habits
- habit_entries
- food_logs
- calorie_settings

---

## Simplified Weekly Report Logic

Algorithm:
1. Fetch last 7 days entries
2. Compare against target_value
3. Compute completion %
4. Store summary JSON

---

## Tech Stack Final

Frontend:
- Next.js App Router
- TypeScript
- TailwindCSS
- Recharts

Backend:
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage (future)

Hosting:
- Vercel

---

## Deployment Steps

1. Setup Supabase project
2. Create schema
3. Enable RLS
4. Deploy to Vercel
5. Add environment variables
6. Configure cron for weekly report

---

## Known MVP Limitations

- Single-user assumption
- No offline mode
- Basic report logic
- No AI insight generation