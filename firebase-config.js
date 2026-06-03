// src/api/firebase-config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 这是你刚刚找到的、你们团队唯一的真实配置！
const firebaseConfig = {
    apiKey: "AIzaSyA3W5R1nG7IA08k0eCTVCoq1ttb5amaQ9k",
    authDomain: "itmp-webg5.firebaseapp.com",
    projectId: "itmp-webg5",
    storageBucket: "itmp-webg5.firebasestorage.app",
    messagingSenderId: "779345203025",
    appId: "1:779345203025:web:dc07b71af9f91aea46cd70",
    measurementId: "G-Z9GM7Y7KXE"
};

// 初始化 Firebase 引擎
const app = initializeApp(firebaseConfig);

// 导出数据库和鉴权实例，供 db-services.js 随时调用
export const db = getFirestore(app);
export const auth = getAuth(app);