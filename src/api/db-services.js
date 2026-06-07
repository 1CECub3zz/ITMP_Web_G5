import { db, auth } from './firebase-config';
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
            authorName: currentUser.displayName || currentUser.email.split('@')[0],
            authorEmail: currentUser.email,
            isPublic: true,
            imageUrl: brewData.imageUrl || null,
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
        return { success: false, errorMessage: error.message };
    }
}

// 图床 bypass
export async function uploadBrewImage(file) {
    try {
        // ⚠️ 架构师提醒：记得去 imgbb.com 申请一个免费的 API Key 填在这里！
        const IMGBB_API_KEY = "YOUR_IMGBB_API_KEY_HERE";

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

// 高级混合搜索引擎
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

// 绝对安全物理擦除
export async function deleteBrewLog(brewId) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return { success: false, errorMessage: "Authentication required." };

        const docRef = doc(db, "brews", brewId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return { success: false, errorMessage: "Record not found." };
        if (docSnap.data().authorUid !== currentUser.uid) {
            return { success: false, errorMessage: "Unauthorized." };
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