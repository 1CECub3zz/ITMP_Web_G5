# BrewTrack

BrewTrack is a modern web application designed for coffee and tea enthusiasts to meticulously log, track, and share their brewing recipes. Built with a focus on immersive aesthetics and fluid user experiences, BrewTrack features a dynamic, interactive background particle system inspired by `antigravity.google`, providing an engaging visual layer over robust functionality.

## Features

- **Dashboard & Analytics**: View your recent brews and brewing statistics at a glance.
- **Log Batch (Add Brew)**: Log detailed parameters for your brews including bean/tea name, roaster, method, dose, temperature, contact time, TDS, and yield.
- **Records**: Browse, search, and filter your personal brewing history.
- **Master Profiles**: Create reusable target profiles (recipes) to standardize your brewing process.
- **Inventory Management**: Track your raw materials (coffee beans, tea leaves) and automatically deduct stock as you brew.
- **Community Recipes**: Share your best brews with the community and explore recipes published by other users. Complete with a masonry layout and image support.
- **Interactive Particle System**: A global, highly responsive canvas background featuring grid-aligned confetti that actively repels away from the mouse cursor and naturally orbits during idle states.
- **Internationalization (i18n)**: Seamlessly switch between English and Chinese interfaces.

## Tech Stack

- **Frontend**: React 18, Vite, React Router v6
- **Styling**: Tailwind CSS, Framer Motion (Animations), Radix UI Primitives, Lucide Icons
- **Database & Backend**: Firebase Firestore (NoSQL database)
- **Authentication**: Firebase Auth (Email/Password, Google OAuth, Password Reset)
- **Media Storage**: ImgBB API for image uploads
- **Deployment**: Firebase Hosting

## Getting Started Locally

To run this project locally on your machine:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The app will typically be available at `http://localhost:5173`.

## Architecture & Configuration

- **Firebase Configuration**: The Firebase settings are initialized in `src/api/firebase-config.js`. It connects to the live production Firestore database.
- **State Management**: Authentication state is globally managed via `AuthContext.jsx`. The application utilizes `react-query` for efficient data fetching and caching where applicable.
- **Routing**: Client-side routing is handled by React Router in `App.jsx`, utilizing a `<ProtectedRoute>` wrapper to prevent unauthorized access to internal pages.
- **Particle Canvas**: The `ParticleCanvas.jsx` component lives outside the React Router tree to prevent re-mounting during navigation, providing a persistent and unbroken background animation. Page content utilizes a `.content-layer` class to enforce `z-index` layering.

## Deployment

This project is deployed using Firebase Hosting. To deploy a new version:

1. **Build the Production Bundle**
   ```bash
   npm run build
   ```
2. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

## Note on Indexes
Certain features, such as the `Master Profiles` and `Inventory` lists, utilize composite queries (e.g., filtering by `authorUid` and ordering by `createdAt desc`). If you encounter errors loading these pages on a new Firebase project, check your browser's developer console for a direct link to automatically generate the necessary Firestore Composite Indexes.
