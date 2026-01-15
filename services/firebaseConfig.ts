import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// These values come from your .env file
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

let app;
let firestore: Firestore | undefined;
let auth: ReturnType<typeof getAuth> | undefined;

try {
    // Check if critical keys are present before initializing
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
        app = initializeApp(firebaseConfig);
        firestore = getFirestore(app);
        auth = getAuth(app);
    } else {
        console.warn("BhumiHub: Firebase API keys missing. App starting in Demo Mode (Mock Data).");
    }
} catch (e) {
    console.error("BhumiHub: Firebase initialization failed. App starting in Demo Mode.", e);
}

// Export potentially undefined instances. 
// services/db.ts handles the fallback logic.
export { firestore, auth };
