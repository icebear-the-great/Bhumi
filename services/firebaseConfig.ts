import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// These values come from your .env file
const firebaseConfig = {
apiKey: "AIzaSyCnza0fLPbV7ATqUTgl7ryG5nvyp42TZ0I",
  authDomain: "bhumi-hub.firebaseapp.com",
  projectId: "bhumi-hub",
  storageBucket: "bhumi-hub.firebasestorage.app",
  messagingSenderId: "988563223727",
  appId: "1:988563223727:web:6d9454c68da2951dcf905a",
  measurementId: "G-F6HVE312JW"
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
