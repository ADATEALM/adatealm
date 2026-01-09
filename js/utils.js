import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBlCbda5aTp4C1xR8iP_k7Ja3f_u8aDr0U",
    authDomain: "adatealm-182e1.firebaseapp.com",
    projectId: "adatealm-182e1",
    storageBucket: "adatealm-182e1.firebasestorage.app",
    messagingSenderId: "558725323264",
    appId: "1:558725323264:web:f39bd70c7eacb6513556e5",
    measurementId: "G-EMTR2CRC69"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Shared Functions ---

/**
 * Checks if the current user has a valid 'pro' subscription.
 * @param {string} uid User ID
 * @returns {Promise<boolean>}
 */
async function checkProStatus(uid) {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            // Check if role is admin OR subscription is active
            if (data.role === 'admin') return true;
            if (data.subscription?.status === 'active') return true;
        }
        return false;
    } catch (e) {
        console.error("Error checking pro status:", e);
        return false;
    }
}

// Hardcoded Admin Emails (Matches Firestore Rules)
const ADMIN_EMAILS = [
    's22market@gmail.com',
    'adatealm@gmail.com',
    'adatshifa@gmail.com',
    'nourmt01@gmail.com',
    'yacinee474474@gmail.com'
];

/**
 * Checks if the user is an Admin (via Email list OR DB role)
 * @param {object} user Firebase Auth User Object (recommended) or UID (string)
 */
async function checkAdminStatus(userOrUid) {
    try {
        let uid = userOrUid;

        // If full user object passed, check email first (Faster)
        if (typeof userOrUid === 'object' && userOrUid.email) {
            if (ADMIN_EMAILS.includes(userOrUid.email.toLowerCase())) return true;
            uid = userOrUid.uid;
        }

        // Fallback: Check DB Role
        const userDoc = await getDoc(doc(db, "users", uid));
        return userDoc.exists() && userDoc.data().role === 'admin';
    } catch (e) {
        console.error("Admin Check Error:", e);
        return false;
    }
}

/**
 * Updates the navigation bar based on auth state
 */
function updateNav(user) {
    // This function assumes specific IDs exist in your header.
    // Since the original header is static, we might need to inject items dynamically or toggle visibility.
    // For now, let's just log.
    console.log("User state changed:", user);
}

/**
 * Triggers Google Sign-In Popup
 */
async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider);
}

export { app, auth, db, checkProStatus, checkAdminStatus, updateNav, onAuthStateChanged, signOut, doc, getDoc, setDoc, signInWithGoogle };
