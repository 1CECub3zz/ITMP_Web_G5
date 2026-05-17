# 🛒 Echo - Campus Second-Hand Marketplace

> A Web-Based Peer-to-Peer Second-Hand Marketplace for Campus Essentials. 
> Developed for the FIT3081 IT Mini Project (Foundation Level).

![HTML5](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3-orange)
![JavaScript](https://img.shields.io/badge/Logic-Vanilla%20JS%20(ES6)-yellow)
![Firebase](https://img.shields.io/badge/Backend-Google%20Firebase-FFCA28)
![Architecture](https://img.shields.io/badge/Architecture-Serverless%20BaaS-blue)

## 📖 Project Overview
The Echo Marketplace is designed to eliminate the fragmented experience of trading campus essentials (textbooks, electronics, furniture) through unstructured social media groups. By centralizing listings and integrating real-time communication, Echo provides a secure, organized, and time-efficient platform exclusively tailored for the university community.

## ✨ Core Features
- **Serverless Architecture:** Fully driven by client-side Vanilla JavaScript interacting directly with Google Firebase.
- **Dynamic DOM Manipulation:** Real-time rendering of marketplace feeds without page reloads.
- **CRUD Operations:** Users can create, read, and manage their second-hand listings seamlessly.
- **Categorized Filtration:** Engineered queries to filter items by categories (e.g., Books, Electronics).
- **Asynchronous Data Flow:** Robust `async/await` implementation for seamless cloud interactions.

## 🛠️ Technology Stack
* **Frontend UI:** HTML5, CSS3 
* **Frontend Logic:** Vanilla JavaScript (ES6 Modules)
* **Backend as a Service (BaaS):** Google Firebase
  * **Database:** Cloud Firestore (NoSQL)
* **Design & Prototyping:** Figma, Draw.io

## 📂 Project Structure
```text
Echo-Marketplace/
├── assets/
│   ├── css/          # Stylesheets for various components
│   ├── images/       # Static image assets
│   └── js/
│       ├── firebase-config.js  # Firebase SDK initialization & API keys
│       ├── db-services.js      # Core Data Service Layer (Black-box API)
├── public/           # Directory designated for Firebase Hosting deployment
├── index.html        # Main marketplace feed & landing page
├── login.html        # Authentication UI
├── create.html       # Form to post a new listing
└── README.md         # Project documentation
