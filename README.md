# ResolveX — Department Admin Panel

Administrative governance and command center web application for **ResolveX** (Department of Artificial Intelligence & Machine Learning).

## Tech Stack
- **React 19**
- **Vite**
- **Tailwind CSS v3**
- **Lucide Icons**
- **Google OAuth**

## Features
- **HOD Command Center**: Real-time grievance monitoring, year/branch filtering (1st–4th year, AIML & AI).
- **Status Updates**: Advance tickets through Pending, In Progress, Resolved, or Rejected with audit notes.
- **Analytics & SLA Insights**: Resolution rates, recurring issue hotspots, and cohort distributions.
- **Circular Broadcasting**: Department-wide announcement publisher with priority alerts.
- **User Governance**: Activate, deactivate, and review CR and Faculty member accounts.

## Getting Started

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Set your backend API URL in `.env`:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server (default port 5174):
   ```bash
   npm run dev
   ```
5. Build for production:
   ```bash
   npm run build
   ```
