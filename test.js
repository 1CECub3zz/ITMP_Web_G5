// test.js
// 1. 导入刚才配置好的 db
import { db } from './firebase-config.js';
// 2. 导入 Firestore 的写入函数
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// 3. 监听按钮点击事件
document.getElementById('btn-submit-listing').addEventListener('click', async () => {
    // 获取前端输入框的值
    const titleValue = document.getElementById('listing-title').value;
    const priceValue = document.getElementById('listing-price').value;

    if (!titleValue || !priceValue) {
        alert("请输入商品名称和价格！");
        return;
    }

    try {
        console.log("准备连接 Firebase 云端...");

        // 核心代码：将数据写入 'listings' 集合
        const docRef = await addDoc(collection(db, "listings"), {
            title: titleValue,
            price: Number(priceValue), // 确保存入的是数字格式
            status: "available",
            createdAt: serverTimestamp() // 使用 Firebase 的时间戳
        });

        console.log("🎉 写入成功！这件商品的云端身份证 (ID) 是: ", docRef.id);
        alert("数据已成功发送！现在请去 Firebase 控制台查看。");

    } catch (error) {
        console.error("❌ 写入失败，请检查网络或配置: ", error);
        alert("写入失败，请按 F12 查看 Console 报错。");
    }
});