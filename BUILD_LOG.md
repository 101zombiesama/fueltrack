# FuelTrack - Build Log

## 2026-04-26 - Initial Build (v0.1.0)

### What was built
Complete food tracking dashboard with AI-powered natural language input.

### Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript
- **UI**: shadcn/ui + Tailwind CSS v4
- **Database**: SQLite via better-sqlite3 (local file at `data/tracker.db`)
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514) for food parsing
- **Charts**: Recharts for weekly calorie visualization
- **Icons**: Lucide React

### Architecture Decisions
1. **SQLite over Postgres/external DB** - Keeps it simple, zero setup, single file. Easy to migrate later if needed.
2. **Server-side SQLite** - Database accessed only in API routes (server-side), never exposed to client.
3. **Claude for food parsing** - Natural language input parsed by LLM into structured nutrition data. Model estimates macros based on USDA standard values.
4. **Single goals row** - Goals stored as a single row (id=1) in the goals table. Simple for now, can add per-date goals later.
5. **No auth** - Single user app for personal tracking. Auth can be added later if needed.

### Pages
- `/` - Dashboard with calorie ring, macro progress bars, weekly chart, today's meals
- `/log` - Food log with date navigation, meal grouping, natural language input
- `/settings` - Daily macro goals with presets (Cut, Maintain, Bulk, High Protein Cut)

### API Routes
- `POST /api/parse-food` - Accepts natural language text, returns parsed food entry via Claude
- `GET /api/entries?date=YYYY-MM-DD` - Get entries for a date
- `DELETE /api/entries` - Delete an entry by id
- `PATCH /api/entries` - Update an entry
- `GET /api/goals` - Get current goals
- `PUT /api/goals` - Update goals
- `GET /api/summary?days=7` - Get daily summaries for the last N days

### Data Model
- `food_entries` - id, date, meal_type, description, items (JSON), total_calories/protein/carbs/fat, created_at
- `goals` - singleton row with calories, protein, carbs, fat targets

### Key Components
- `CalorieRing` - SVG circular progress for daily calorie tracking
- `MacroBars` - Color-coded progress bars for protein (blue), carbs (amber), fat (rose)
- `MealCard` - Individual meal display with item breakdown and delete
- `WeeklyChart` - 7-day bar chart with goal reference line
- `FoodInput` - Natural language textarea with send button, shows parsed result

### Setup Required
1. `npm install`
2. Copy `.env.example` to `.env` and add your `ANTHROPIC_API_KEY`
3. `npm run dev`
4. Database auto-creates on first request

---
