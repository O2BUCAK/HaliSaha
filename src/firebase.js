// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Check if Firebase is fully configured via environment variables or has default provisioned values
export const isFirebaseConfigured = true;

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBuykPO_0K1aG7ALHsc3rFiGWr0G-tiLQk",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "halisaha-projesi-b057b.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "halisaha-projesi-b057b",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "halisaha-projesi-b057b.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "142695896602",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:142695896602:web:227c2f31c07f12820823a3",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let _analytics = null;
try {
    if (isFirebaseConfigured && typeof window !== 'undefined' && firebaseConfig.measurementId) {
        _analytics = getAnalytics(app);
    }
} catch (e) {
    console.warn("Analytics initialization failed:", e);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export { _analytics as analytics };
