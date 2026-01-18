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


  apiKey: "AIzaSyCnza0fLPbV7ATqUTgl7ryG5nvyp42TZ0I",
  authDomain: "bhumi-hub.firebaseapp.com",
  projectId: "bhumi-hub",
  storageBucket: "bhumi-hub.firebasestorage.app",
  messagingSenderId: "988563223727",
  appId: "1:988563223727:web:6d9454c68da2951dcf905a",
  measurementId: "G-F6HVE312JW"
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
