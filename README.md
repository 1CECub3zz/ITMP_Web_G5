# ☕ Echo - Web-based Beverage Brewing & Review System

> A dedicated platform for coffee and tea enthusiasts to log parameters, track recipes, and share reviews.
> Developed for the FIT3081 IT Mini Project (Foundation Level).

![HTML5](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3-orange)
![JavaScript](https://img.shields.io/badge/Logic-Vanilla%20JS%20(ES6)-yellow)
![Firebase](https://img.shields.io/badge/Backend-Google%20Firebase-FFCA28)
![Architecture](https://img.shields.io/badge/Architecture-Serverless%20BaaS-blue)

## 📖 Project Overview
Echo is a specialized brewing log and review system. It replaces scattered physical notebooks with a centralized, cloud-based platform. Users can meticulously record their brewing parameters (dose, yield, temperature, method), rate their cups, and explore top-rated recipes from the community.

## ✨ Core Features
- **Serverless Architecture:** Driven by Vanilla JavaScript and Google Firebase.
- **Nested Data Logging:** Complex NoSQL schema handling nested metrics (`basics`, `parameters`, `review`).
- **Authentication:** Secure user sessions via Firebase Anonymous/Email Auth.
- **Dynamic Leaderboards:** Server-side sorting for top-rated community brews.

## 🛠️ Technology Stack
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6 Modules)
* **Backend BaaS:** Google Firebase (Auth, Cloud Firestore)
* **Design:** Figma, Draw.io

## 📂 Architecture & Schema
The system utilizes a denormalized NoSQL document structure:
- `users`: Stores user metadata and total brew counts.
- `brews`: The core collection featuring nested maps for `basics`, `parameters`, and `reviews`.
- `comments`: A sub-system for community interactions on specific brews.

## 👥 Team Echo (Group 5)
* **Member 1:** Project Manager & Systems Analyst
* **Member 2:** UI/UX Lead
* **Member 3:** Frontend Builder
* **Member 4:** Core Database Integrator (NoSQL Schema, Read/Write APIs)
* **Member 5:** Auth & Real-Time Specialist