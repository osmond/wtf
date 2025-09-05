# Plant Care App

Plant Care App helps you track and nurture your houseplants. Manage plant details, stay on top of watering and fertilizing schedules, and view upcoming tasks so your collection thrives.

## Features

- Create and edit plant profiles with species, location, and photos
- Automatic watering and fertilizing schedules based on species data
- Task tracking with reminders for upcoming care activities
- Daily digest and weather-aware recommendations
- Mobile-friendly interface

## Getting Started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (via Corepack)

### Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Create a `.env` file with required variables:
   ```bash
   DATABASE_URL="file:./prisma/dev.db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="dev-secret-change-me"
   OPENWEATHER_API_KEY="your-api-key"   # optional, enables weather widget
   WEATHER_UNITS="metric"               # or "imperial"
   ```
   `ANALYZE=true` can be set to enable bundle analysis.

3. Start the development server:
   ```bash
   pnpm dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Directory Overview

- `app/plants/` – Next.js routes powering plant features like creation, analytics, and daily schedules.
- `components/` – Reusable UI components such as `PlantForm`, `PlantCard`, and `TodayTasksClient` used throughout the app.

## About the Template

This project originated from the [Next.js Enterprise Boilerplate](https://blazity.com/open-source/nextjs-enterprise-boilerplate). Boilerplate-specific documentation has been omitted for clarity; see the template repository for details.

## License

MIT

