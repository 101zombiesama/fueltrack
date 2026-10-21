
# FuelTrack

**AI-powered food and macro tracking, without the tedious manual logging.**

FuelTrack is a full-stack nutrition tracking application that makes logging food as simple as describing what you ate.

Instead of manually searching food databases and entering individual ingredients, users can describe their meals in natural language. FuelTrack uses AI to identify foods, estimate nutritional values, and automatically log calories, protein, carbohydrates, and fats.

The application is designed for individuals who want to monitor their nutrition, whether their goal is weight loss, muscle gain, or maintaining a balanced diet.

## Features

### AI-Powered Food Logging
- Log meals using natural-language descriptions.
- Automatically identify food items, quantities, and estimated nutritional values.
- Process multiple food items in a single entry.
- Support meals across different dates and meal categories.
- Edit or delete previously logged entries.

### Nutrition Dashboard
- Track daily calorie and macronutrient consumption.
- Visualize progress toward personalized nutrition goals.
- View historical calorie and macro trends.
- Explore nutrition data over 7, 30, or 90 days.
- Navigate between daily food logs.

### Personalized Goals
- Set daily calorie, protein, carbohydrate, and fat targets.
- Choose from predefined goals such as cutting, maintenance, and bulking.
- Track progress against daily targets.

### Authentication & User Management
- Secure authentication using signed sessions.
- Password hashing and HTTP-only session cookies.
- Administrator-managed user accounts.
- User-specific nutrition history and settings.

### Responsive Interface
- Modern interface built with React and Tailwind CSS.
- Responsive layouts for desktop and mobile.
- Interactive dashboards and charts.
- Light and dark theme support.

---

## Future Features & Roadmap

FuelTrack is actively evolving toward a multimodal, intelligent nutrition management platform.

The following features are planned and are not yet implemented.

### Multimodal Food Logging

- [ ] **Image-Based Food Recognition**
  - Upload or capture photos of meals.
  - Use multimodal AI to identify food items and ingredients.
  - Estimate portion sizes and nutritional values from images.
  - Support meals containing multiple food items.
  - Allow users to correct recognition results before saving.

- [ ] **Voice-Controlled Food Logging**
  - Log meals through natural spoken commands.
  - Convert speech into structured food entries.
  - Support conversational corrections such as "Actually, that was 150 grams of chicken, not 200."
  - Maintain conversation context across multiple food entries.
  - Enable hands-free logging through a voice-driven interface.

- [ ] **Barcode & Nutrition Label Scanning**
  - Scan product barcodes to retrieve nutritional information.
  - Extract nutritional values from photographed food labels.
  - Combine packaged-food data with AI-estimated ingredients.
  - Automatically calculate macros based on consumed quantities.

### Advanced Nutrition Intelligence

- [ ] **AI Nutrition Coach**
  - Analyze long-term dietary patterns and nutritional trends.
  - Generate personalized nutritional insights based on user-defined goals.
  - Identify recurring gaps in calorie or macronutrient intake.
  - Provide contextual meal suggestions based on remaining daily targets.
  - Explain recommendations using historical consumption data.

- [ ] **Intelligent Recipe & Ingredient Tracking**
  - Create reusable recipes from ingredient lists or natural-language descriptions.
  - Automatically calculate total nutritional values.
  - Support dynamic ingredient substitutions and quantity adjustments.
  - Recalculate nutrients when ingredients or serving sizes change.
  - Track servings consumed from shared or batch-prepared meals.

- [ ] **Context-Aware Food Recognition**
  - Remember frequently logged meals and user-defined food preferences.
  - Recognize recurring recipes and custom serving sizes.
  - Detect potentially duplicated meal entries.
  - Handle ambiguous descriptions using confidence estimates and clarification prompts.
  - Improve consistency between previously logged meals and new AI estimates.

### Intelligent Planning & Analytics

- [ ] **Adaptive Meal Planning**
  - Generate multi-day meal plans based on nutritional targets.
  - Incorporate dietary preferences, restrictions, and available ingredients.
  - Automatically calculate daily and weekly nutritional totals.
  - Adjust remaining meal recommendations based on actual consumption.
  - Generate shopping lists from meal plans.

- [ ] **Advanced Nutrition Analytics**
  - Identify changes in calorie and macronutrient consumption over time.
  - Compare actual consumption against personalized goals.
  - Provide weekly and monthly nutrition summaries.
  - Highlight deviations and recurring dietary patterns.
  - Support exportable reports and historical data analysis.

### Platform & Engineering Improvements

- [ ] **Offline Logging & Synchronization**
  - Allow food entries to be created without internet connectivity.
  - Queue AI-dependent processing until connectivity is restored.
  - Synchronize local and remote entries when the user reconnects.
  - Handle synchronization conflicts and duplicate submissions.

- [ ] **Automated Testing & Reliability**
  - Introduce integration and end-to-end tests.
  - Validate authentication and user-level data isolation.
  - Add structured error handling for AI parsing failures.
  - Improve logging, observability, and API resilience.

- [ ] **Data Portability**
  - Export nutritional history to CSV.
  - Support importing existing food-tracking records.
  - Provide structured data backups and restoration.

---

## How It Works

FuelTrack combines natural-language processing with a persistent nutrition-tracking system.

1. **User Input:** A user describes their meal through the food logging interface.
2. **AI Processing:** The application sends the description to OpenAI through a server-side API.
3. **Structured Extraction:** The AI identifies individual foods, quantities, meal categories, and estimated nutritional values.
4. **Data Persistence:** Parsed food entries are stored in a libSQL-compatible database and associated with the authenticated user.
5. **Nutrition Aggregation:** The application calculates daily totals and compares them with user-defined targets.
6. **Visualization:** Dashboards and historical charts present calorie and macronutrient consumption.

AI-generated nutritional values are estimates and can be corrected through the food log interface.

## Tech Stack

| Category | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui, Base UI |
| AI Integration | OpenAI API |
| Database | libSQL / SQLite / Turso |
| Authentication | JWT, jose, bcryptjs |
| Data Visualization | Recharts |
| Icons | Lucide React |
| Deployment | Vercel |

## Getting Started

### Prerequisites

Before running the application, ensure you have:

- Node.js 20.9 or later
- npm
- An OpenAI API key

The default local configuration uses SQLite through libSQL and does not require a separate database server.

### 1. Clone the Repository

```bash
git clone https://github.com/101zombiesama/fueltrack.git
cd fueltrack
```

### 2. Install Dependencies

```bash
npm ci
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
mkdir -p data
```

Update `.env.local` with your configuration:

```env
OPENAI_API_KEY=your_openai_api_key
AUTH_SECRET=your_secure_random_secret
TURSO_DATABASE_URL=file:data/local.db
TURSO_AUTH_TOKEN=
```

Generate a secure authentication secret:

```bash
openssl rand -base64 32
```

For hosted Turso deployments, configure the hosted database URL and authentication token.

**Important:** Never commit actual API keys, authentication secrets, or database credentials.

### 4. Start the Development Server

```bash
npm run dev
```

Open:

http://localhost:3000

On a fresh installation, create the initial administrator account from the signup screen.

Subsequent user accounts are managed by an administrator.

### 5. Production Build

```bash
npm run build
npm run start
```

### 6. Linting

```bash
npm run lint
```

## Project Structure

```text
src/
├── app/
│   ├── page.tsx             # Nutrition dashboard
│   ├── log/                 # Food history
│   ├── settings/            # Nutrition goals and account settings
│   ├── login/               # Authentication
│   ├── signup/              # Initial account creation
│   └── api/                 # Backend API routes
├── components/              # Reusable UI components
└── lib/
    ├── auth.ts              # Authentication and session utilities
    ├── db.ts                # Database schema and operations
    └── types.ts             # Shared TypeScript definitions
```

## API Overview

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/parse-food` | Parse and log food descriptions |
| GET | `/api/entries` | Retrieve food entries |
| PATCH | `/api/entries` | Update existing entries |
| DELETE | `/api/entries` | Delete food entries |
| GET | `/api/goals` | Retrieve nutrition goals |
| PUT | `/api/goals` | Update nutrition goals |
| GET | `/api/summary` | Retrieve aggregated nutrition data |
| POST | `/api/auth/login` | Authenticate a user |
| POST | `/api/auth/signup` | Create the initial administrator |
| GET, POST | `/api/admin/users` | Administrator user management |

## Security & Privacy

FuelTrack incorporates several security measures:

- Server-side OpenAI API integration.
- Password hashing using bcryptjs.
- Signed JWT authentication.
- HTTP-only session cookies.
- User-scoped database operations.
- Environment-based credential management.

Sensitive configuration files and local database files are excluded through `.gitignore`.

**Do not commit actual credentials or real personal/customer data.**

Before contributing or deploying, review the repository and its commit history for accidentally committed secrets.

## License

FuelTrack is open-source software distributed under the [MIT License](LICENSE).

See the `LICENSE` file for details.
