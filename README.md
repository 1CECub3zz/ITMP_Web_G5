# ☕ BrewTrack
**A Web-based Beverage Brewing & Review System**

Welcome to the official repository for **BrewTrack**, a centralized, cloud-based platform designed to replace physical notebooks. It empowers beverage enthusiasts, baristas, and casual brewers to log, track, and share intricate brewing parameters (e.g., dose, yield, temperature, methods) with a global community.

---

## 🏗️ System Architecture
To achieve an optimal balance between a highly interactive user interface and robust database security, this project employs a **Decoupled Hybrid Architecture**.

* **Presentation Layer (Frontend):** Constructed utilizing **React.js** and **Tailwind CSS**. This allows for complex state management, responsive pagination, dynamic filtering, and fluid UI animations.
* **Data Service Layer (Backend):** Engineered using **Vanilla JavaScript (ES6 Modules)** and **Google Firebase (Firestore & Authentication)**. This independent API layer acts as a secure intermediary black-box, encapsulating all database writes, schema validation, and authentication lifecycles without UI interference.

This strict **Separation of Concerns (SoC)** ensures the frontend remains lightweight, while the backend securely handles high-concurrency cloud operations.

---

## ✨ Core Features
* **Global Authentication Guard:** Event-driven session monitoring (`onAuthStateChanged`) that actively protects private routes and redirects unauthorized access.
* **Multi-Step Data Ingestion:** A streamlined wizard for users to input precise brewing telemetry (Basics, Parameters, and Reviews).
* **Community Leaderboard & Archives:** Dynamic data rendering utilizing Firestore server-side compound indexes for optimal querying performance.
* **Nested Comment Engine:** A scalable One-to-Many relational NoSQL schema linking specific community comments to individual brew logs without breaching single-document size limits (1MB).
* **Internationalization (i18n):** Full web page translation support mapping UI labels and feedback messages seamlessly.

---

## 🗄️ Database Schema (NoSQL Firestore)
The system operates on a denormalized database structure leveraging two primary collections:
1. `brews`: Stores high-granularity brewing logs using complex nested maps (`basics`, `parameters`, `review`).
2. `comments`: A decoupled collection structurally bound to specific recipes via a `brewId` foreign key, neutralizing array-append bottlenecks.

---

## 🚀 Quick Start / Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/your-repo-link/brewtrack.git](https://github.com/your-repo-link/brewtrack.git)