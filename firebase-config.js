// firebase-config.js
// 1. 从网络直接引入 Firebase 核心库和 Firestore 数据库
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// 2. 你的专属项目配置字典
const firebaseConfig = {
    apiKey: "AIzaSyA3W5R1nG7IA08k0eCTVCoq1ttb5amaQ9k",
    authDomain: "itmp-webg5.firebaseapp.com",
    projectId: "itmp-webg5",
    storageBucket: "itmp-webg5.firebasestorage.app",
    messagingSenderId: "779345203025",
    appId: "1:779345203025:web:dc07b71af9f91aea46cd70",
    measurementId: "G-Z9GM7Y7KXE"
};

// 3. 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 4. 初始化并导出 Firestore 数据库实例，让其他文件可以使用 'db'
export const db = getFirestore(app);