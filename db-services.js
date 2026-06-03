import { db, auth } from './firebase-config';

// 💥 修复 1：全面使用 npm 模块化的 Firebase 引入方式，抛弃 Vanilla CDN
import {
    collection, addDoc, serverTimestamp, getDocs, query, where,
    orderBy, limit, doc, getDoc, deleteDoc
} from "firebase/firestore";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";

// ==========================================
// Module 1: Create a New Brew Log & Upload Media
// ==========================================
export async function submitBrewLog(brewData) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return { success: false, errorMessage: "Authentication required." };

        const docRef = await addDoc(collection(db, "brews"), {
            authorUid: currentUser.uid,
            authorName: currentUser.displayName || currentUser.email.split('@')[0], // 供社区展示
            authorEmail: currentUser.email,
            isPublic: true,
            imageUrl: brewData.imageUrl || null, // 💥 确保图片 URL 被保存
            basics: {
                beanName: brewData.beanName || "Unknown Bean",
                roaster: brewData.roaster || "Unknown Roaster"
            },
            parameters: {
                method: brewData.method || "V60",
                dose_grams: Number(brewData.dose_grams) || 0
            },
            review: {
                rating: Number(brewData.rating) || 0,
                comment: brewData.comment || ""
            },
            metrics: { commentCount: 0 },
            createdAt: serverTimestamp()
        });

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("❌ Submit Error: ", error);
        return { success: false, errorMessage: error.message };
    }
}

// 💥 找回模块：绕过计费墙的 ImgBB 免费图床 API
export async function uploadBrewImage(file) {
    try {
        // 请换成你之前在 ImgBB 申请的真实 API Key
        const IMGBB_API_KEY = "1f524b4cb8a66dafff74eb9d433ef80c";

        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            return { success: true, url: result.data.url };
        } else {
            throw new Error(result.error.message);
        }
    } catch (error) {
        console.error("❌ Upload failed:", error);
        return { success: false, errorMessage: error.message };
    }
}


// ==========================================
// Module 2 & 3: Fetch Data (Top Rated & My Records)
// ==========================================
export async function getTopRatedBrews() {
    try {
        const q = query(collection(db, "brews"), orderBy("review.rating", "desc"), limit(20));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) { return []; }
}

export async function getMyBrews() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return [];
        const q = query(collection(db, "brews"), where("authorUid", "==", currentUser.uid), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) { return []; }
}

// 💥 找回模块：混合高级搜索引擎
export async function searchCommunityBrews(keyword = "", methodFilter = "all", minRating = 0) {
    try {
        const q = query(collection(db, "brews"), orderBy("createdAt", "desc"), limit(100));
        const querySnapshot = await getDocs(q);

        let results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const lowerKeyword = keyword.toLowerCase().trim();

        return results.filter(brew => {
            const matchesKeyword = lowerKeyword === "" ||
                brew.basics.beanName.toLowerCase().includes(lowerKeyword) ||
                brew.basics.roaster.toLowerCase().includes(lowerKeyword);
            const matchesMethod = methodFilter === "all" || brew.parameters.method === methodFilter;
            const matchesRating = brew.review.rating >= minRating;
            return matchesKeyword && matchesMethod && matchesRating;
        });
    } catch (error) { return []; }
}

// ==========================================
// Module 4: Single Fetch & Secure Delete
// ==========================================
export async function getBrewById(brewId) {
    try {
        const docRef = doc(db, "brews", brewId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) { return null; }
}

// 💥 找回模块：安全删除 API (带权限校验)
export async function deleteBrewLog(brewId) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return { success: false, errorMessage: "Authentication required." };

        const docRef = doc(db, "brews", brewId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return { success: false, errorMessage: "Record not found." };
        if (docSnap.data().authorUid !== currentUser.uid) {
            return { success: false, errorMessage: "Unauthorized: You can only delete your own records." };
        }

        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

// ==========================================
// Module 5: Comment Engine
// ==========================================
export async function addCommentToBrew(brewId, commentText) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return { success: false, errorMessage: "Must be logged in to comment." };

        await addDoc(collection(db, "comments"), {
            brewId: brewId,
            authorUid: currentUser.uid,
            authorName: currentUser.displayName || "Unknown Brewer",
            text: commentText,
            createdAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

export async function getCommentsForBrew(brewId) {
    try {
        const q = query(collection(db, "comments"), where("brewId", "==", brewId), orderBy("createdAt", "asc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) { return []; }
}

// ==========================================
// Module 6: Authentic Firebase Auth Actions
// ==========================================
export async function registerNewUser(email, password, fullName) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: fullName });
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

export async function loginWithEmail(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, errorMessage: "Invalid email or password." };
    }
}

// 💥 找回模块：真正的 Google 一键登录
export async function loginWithGoogleAuth() {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        return { success: true, user: result.user };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

export async function logoutUser() {
    await signOut(auth);
    return { success: true };
}