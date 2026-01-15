import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// Priority: 
// 1. Environment Variables (Build time)
// 2. Local Storage (Runtime via UI)

const getStoredConfig = () => {
    try {
        const stored = localStorage.getItem('bhumi_firebase_config');
        if (stored) return JSON.parse(stored);
    } catch (e) { return null; }
    return null;
};

let firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Check if Env vars are effectively empty/undefined and try fallback
if (!firebaseConfig.apiKey) {
    const stored = getStoredConfig();
    if (stored && stored.apiKey) {
        firebaseConfig = stored;
    }
}

let app;
let firestore: Firestore | undefined;
let auth: ReturnType<typeof getAuth> | undefined;
let isDemoMode = true;

try {
    // Check if critical keys are present before initializing
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
        app = initializeApp(firebaseConfig);
        firestore = getFirestore(app);
        auth = getAuth(app);
        isDemoMode = false;
    } else {
        console.warn("BhumiHub: Firebase API keys missing. App starting in Demo Mode (Mock Data).");
    }
} catch (e) {
    console.error("BhumiHub: Firebase initialization failed. App starting in Demo Mode.", e);
}

// Helpers for UI-based configuration
export const updateFirebaseConfig = (config: any) => {
    localStorage.setItem('bhumi_firebase_config', JSON.stringify(config));
    window.location.reload();
};

export const clearFirebaseConfig = () => {
    localStorage.removeItem('bhumi_firebase_config');
    window.location.reload();
};

export const getIsDemoMode = () => isDemoMode;

export { firestore, auth };
