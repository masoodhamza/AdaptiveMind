# AdaptiveMind Lite - Project Context & Rules

## Project Overview
AdaptiveMind Lite is a dynamic learning platform that generates multiple-choice questions (MCQs) on demand. It creates assessments tailored to specific subjects, difficulty levels, and Bloom's Taxonomy cognitive levels.

## Tech Stack & Architecture
- **Framework:** Next.js 15+ (App Router)
- **Quiz Engine:** Proprietary logic for generating balanced assessments.
- **Backend/Real-time:** Firebase (Authentication and Firestore)
- **Deployment:** Containerized via `Dockerfile` (Next.js standalone output) and deployed to **Google Cloud Run**.
- **Styling:** Tailwind CSS, Framer Motion for animations
- **Icons:** Lucide React

## Core Features
1. **Dynamic Quiz Builder:** Users can choose subjects, difficulty, and question count.
2. **AI Question Generation:** Questions include diverse types (Conceptual, Applied, Factual) following Bloom's Taxonomy. The generated `bloomType` is explicitly enforced in the API schema and displayed in the UI.
3. **Multiplayer (Battle Mode):** Users can create or join lobbies for real-time competitive testing using Firestore real-time listeners.
4. **Leaderboards:** Tracks high scores globally using Firestore.
5. **Authentication:** Supports Google Sign-In for leaderboard syncing and real-time features, with an Anonymous Guest mode for local-only testing.

## Important Project Rules
- **Environment Variables:**
  - `NEXT_PUBLIC_GEMINI_API_KEY` is used for Gemini API calls. AI Studio automatically injects this at runtime from user secrets.
  - **Firebase Configuration** is strictly stored in `firebase-applet-config.json`. These are public client keys; do not put them in `.env`.
- **Database Rules:** All Firestore interactions must strictly adhere to the schemas defined in `firebase-blueprint.json` and the security rules in `firestore.rules`.
- **Latency Handling:** Auth state changes and AI generations should always have visible loaders (`Loader2` from lucide).
- **Responsive Design:** The app is designed to be mobile-responsive with a "Mind Map" layout.

## Suggested Prompt for AI Agents
"I am working on AdaptiveMind Lite, a Next.js/Firebase MCQ platform deployed on Google Cloud Run. Please help me maintain the Bloom's Taxonomy logic via Server Actions, and ensure all real-time lobby features in Firestore remain consistent with the existing `firestore.rules` and `firebase-blueprint.json` schemas."
