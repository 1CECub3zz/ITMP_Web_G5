import { db, auth } from './firebase-config';
import {
    collection, addDoc, serverTimestamp, getDocs, query, where,
    orderBy, limit, doc, getDoc, deleteDoc, updateDoc, increment
} from "firebase/firestore";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    confirmPasswordReset
} from "firebase/auth";

// ==========================================
// 1. 冲煮记录模块 (Brew Logs)
// ==========================================
export async function submitBrewLog(brewData) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return { success: false, errorMessage: "Authentication required." };

        const docRef = await addDoc(collection(db, "brews"), {
            authorUid: currentUser.uid,
            authorName: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Brewer'),
            isPublic: true,
            imageUrl: brewData.imageUrl || null,
            basics: { beanName: brewData.beanName, roaster: brewData.roaster },
            parameters: {
                method: brewData.method,
                dose_grams: Number(brewData.dose_grams) || 0,
                pax: Number(brewData.pax) || 1,
                time: brewData.time || null,
                // New production fields
                waterTemp: Number(brewData.waterTemp) || null,
                waterVolumeLiters: Number(brewData.waterVolumeLiters) || null,
                contactTimeSecs: Number(brewData.contactTimeSecs) || null,
                tds: Number(brewData.tds) || null,
                yieldVolumeMl: Number(brewData.yieldVolumeMl) || null,
            },
            production: {
                lotId: brewData.lotId || null,
                lotName: brewData.lotName || null,
                actualWeightGrams: Number(brewData.actualWeightGrams) || null,
                masterProfileId: brewData.masterProfileId || null,
                masterProfileName: brewData.masterProfileName || null,
                tastePassed: brewData.tastePassed ?? null,
                sensoryNotes: brewData.sensoryNotes || "",
            },
            review: {
                rating: Number(brewData.rating) || 0,
                comment: brewData.comment || "",
                flavor: Number(brewData.flavor) || 0,
                ease: Number(brewData.ease) || 0,
            },
            metrics: { commentCount: 0 },
            createdAt: serverTimestamp()
        });

        // Auto-deduct from inventory lot if one was selected
        if (brewData.lotId && brewData.actualWeightGrams) {
            await deductFromLot(brewData.lotId, Number(brewData.actualWeightGrams));
        }

        return { success: true, id: docRef.id };
    } catch (error) { return { success: false, errorMessage: error.message }; }
}

export async function updateBrewLog(brewId, updateData) {
    try {
        const docRef = doc(db, "brews", brewId);
        await updateDoc(docRef, updateData);
        return { success: true };
    } catch (error) { return { success: false, errorMessage: error.message }; }
}

export async function deleteBrewLog(brewId) {
    try {
        const docRef = doc(db, "brews", brewId);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) { return { success: false, errorMessage: error.message }; }
}

// ==========================================
// 2. 数据获取与搜索 (Queries)
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
        const q = query(collection(db, "brews"), where("authorUid", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        const myBrewsArray = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return myBrewsArray.sort((a, b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0));
    } catch (error) { return []; }
}

export async function searchCommunityBrews(keyword = "", typeFilter = "all") {
    try {
        const q = query(collection(db, "brews"), orderBy("createdAt", "desc"), limit(100));
        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const lower = keyword.toLowerCase().trim();
        return results.filter(b =>
            (lower === "" || b.basics?.beanName?.toLowerCase().includes(lower)) &&
            (typeFilter === "all" || b.basics?.roaster === typeFilter)
        );
    } catch (error) { return []; }
}

export async function getBrewById(id) {
    try {
        const snap = await getDoc(doc(db, "brews", id));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch (error) {
        console.error("getBrewById failed:", error);
        return null;
    }
}

// ==========================================
// 3. 评论与图床 (Comments & Media)
// ==========================================
export async function addCommentToBrew(brewId, text) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return { success: false, errorMessage: "Authentication required." };
        await addDoc(collection(db, "comments"), {
            brewId,
            authorUid: currentUser.uid,
            authorName: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Brewer'),
            text,
            createdAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) { return { success: false, errorMessage: error.message }; }
}

export async function getCommentsForBrew(brewId) {
    const q = query(collection(db, "comments"), where("brewId", "==", brewId), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function uploadBrewImage(file) {
    try {
        const formData = new FormData();
        formData.append("image", file);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=1f524b4cb8a66dafff74eb9d433ef80c`, { method: "POST", body: formData });
        const data = await res.json();
        return data.success ? { success: true, url: data.data.url } : { success: false };
    } catch (e) { return { success: false }; }
}

// ==========================================
// 4. Auth 认证模块
// ==========================================
export async function registerNewUser(email, password, fullName) {
    try {
        const user = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user.user, { displayName: fullName });
        return { success: true };
    } catch (error) { return { success: false, errorMessage: error.message }; }
}

export async function loginWithEmail(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        return { success: true };
    } catch (error) { return { success: false, errorMessage: error.message }; }
}

export async function loginWithGoogleAuth() {
    try {
        await signInWithPopup(auth, new GoogleAuthProvider());
        return { success: true };
    } catch (error) { return { success: false, errorMessage: error.message }; }
}

export async function logoutUser() { await signOut(auth); }

export async function sendResetEmail(email) {
    try { await sendPasswordResetEmail(auth, email); return { success: true }; }
    catch (e) { return { success: false, errorMessage: e.message }; }
}

export async function confirmNewPassword(token, password) {
    try { await confirmPasswordReset(auth, token, password); return { success: true }; }
    catch (e) { return { success: false, errorMessage: e.message }; }
}

// ==========================================
// 5. Master Profiles (Recipe Target Specs)
// ==========================================
export async function createMasterProfile(profileData) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return { success: false, errorMessage: "Authentication required." };
        const docRef = await addDoc(collection(db, "masterProfiles"), {
            authorUid: currentUser.uid,
            name: profileData.name,
            beverageType: profileData.beverageType || 'Coffee',
            method: profileData.method || 'Pour Over',
            targetDoseGrams: Number(profileData.targetDoseGrams) || 0,
            targetWaterTempC: Number(profileData.targetWaterTempC) || 0,
            targetSteepTimeSecs: Number(profileData.targetSteepTimeSecs) || 0,
            targetTdsMin: Number(profileData.targetTdsMin) || 0,
            targetTdsMax: Number(profileData.targetTdsMax) || 0,
            targetYieldMl: Number(profileData.targetYieldMl) || 0,
            notes: profileData.notes || "",
            createdAt: serverTimestamp(),
        });
        return { success: true, id: docRef.id };
    } catch (error) { return { success: false, errorMessage: error.message }; }
}

export async function getMasterProfiles() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return [];
        const q = query(collection(db, "masterProfiles"), where("authorUid", "==", currentUser.uid), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("❌ getMasterProfiles failed:", error.message, "\n💡 If the error mentions an index, click the link in the browser console to create it in Firebase.");
        return [];
    }
}

export async function updateMasterProfile(profileId, updateData) {
    try {
        await updateDoc(doc(db, "masterProfiles", profileId), updateData);
        return { success: true };
    } catch (error) { return { success: false, errorMessage: error.message }; }
}

export async function deleteMasterProfile(profileId) {
    try {
        await deleteDoc(doc(db, "masterProfiles", profileId));
        return { success: true };
    } catch (error) { return { success: false, errorMessage: error.message }; }
}

// ==========================================
// 6. Inventory / MRP (Raw Material Lots)
// ==========================================
export async function addInventoryLot(lotData) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return { success: false, errorMessage: "Authentication required." };
        const docRef = await addDoc(collection(db, "inventory"), {
            authorUid: currentUser.uid,
            materialName: lotData.materialName,
            materialType: lotData.materialType || 'Coffee',
            lotNumber: lotData.lotNumber || "",
            supplier: lotData.supplier || "",
            receivedDate: lotData.receivedDate || null,
            expiryDate: lotData.expiryDate || null,
            initialWeightGrams: Number(lotData.initialWeightGrams) || 0,
            totalDeductedGrams: 0,
            lowStockThresholdGrams: Number(lotData.lowStockThresholdGrams) || 200,
            notes: lotData.notes || "",
            createdAt: serverTimestamp(),
        });
        return { success: true, id: docRef.id };
    } catch (error) { return { success: false, errorMessage: error.message }; }
}

export async function getInventoryLots() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return [];
        const q = query(collection(db, "inventory"), where("authorUid", "==", currentUser.uid), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                currentStockGrams: (data.initialWeightGrams || 0) - (data.totalDeductedGrams || 0),
            };
        });
    } catch (error) { return []; }
}

export async function updateInventoryLot(lotId, updateData) {
    try {
        await updateDoc(doc(db, "inventory", lotId), updateData);
        return { success: true };
    } catch (error) { return { success: false, errorMessage: error.message }; }
}

export async function deductFromLot(lotId, amountGrams) {
    try {
        await updateDoc(doc(db, "inventory", lotId), {
            totalDeductedGrams: increment(Number(amountGrams) || 0)
        });
        return { success: true };
    } catch (error) { return { success: false, errorMessage: error.message }; }
}

export async function deleteInventoryLot(lotId) {
    try {
        await deleteDoc(doc(db, "inventory", lotId));
        return { success: true };
    } catch (error) { return { success: false, errorMessage: error.message }; }
}