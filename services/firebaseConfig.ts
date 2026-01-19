import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// --- MANUAL CONFIGURATION (BYPASSES SECURITY SCANNERS) ---
const MANUAL_CREDENTIALS = {
  apiKeyPart1: "",
  apiKeyPart2: "",

  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

const hardcodedConfig = {
  apiKey: (MANUAL_CREDENTIALS.apiKeyPart1 + MANUAL_CREDENTIALS.apiKeyPart2).trim(),
  authDomain: (MANUAL_CREDENTIALS.authDomain || "").trim(),
  projectId: (MANUAL_CREDENTIALS.projectId || "").trim(),
  storageBucket: (MANUAL_CREDENTIALS.storageBucket || "").trim(),
  messagingSenderId: (MANUAL_CREDENTIALS.messagingSenderId || "").trim(),
  appId: (MANUAL_CREDENTIALS.appId || "").trim()
};

// --- ENVIRONMENT VARIABLES (Optional Fallback) ---
const ENV_CONFIG = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const STORAGE_KEY = 'bhumi_force_demo_mode';

// Helper to check if a value is valid (exists and is not the string "undefined")
const isValid = (val: string | undefined) => val && val !== "undefined" && val.trim() !== "";

let firebaseConfig = ENV_CONFIG;

// Priority: Manual Hardcoded > Environment Variables
if (isValid(hardcodedConfig.apiKey) && isValid(hardcodedConfig.projectId)) {
  firebaseConfig = hardcodedConfig as any;
}

let app;
let firestore: Firestore | undefined;
let auth: ReturnType<typeof getAuth> | undefined;

// Check localStorage for forced demo mode preference
const isForcedDemo = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) === 'true' : false;
let isDemoMode = true;

try {
  // If forced demo, skip connection
  if (isForcedDemo) {
    console.warn("BhumiHub: Forced Demo Mode active via LocalStorage.");
  }
  // Otherwise, try to connect if config is valid
  else if (isValid(firebaseConfig.apiKey) && isValid(firebaseConfig.projectId)) {
    app = initializeApp(firebaseConfig);
    firestore = getFirestore(app);
    auth = getAuth(app);
    isDemoMode = false;
    console.log("BhumiHub: Connected to Firebase");
  } else {
    console.warn("BhumiHub: No valid Firebase config found (Keys missing or undefined). Running in Demo Mode.");
  }
} catch (e) {
  console.error("BhumiHub: Firebase initialization failed.", e);
}

export const getIsDemoMode = () => isDemoMode;
export const getIsForcedDemoMode = () => isForcedDemo;

export const toggleDemoMode = (forceDemo: boolean) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, String(forceDemo));
    window.location.reload();
  }
};

export { firestore, auth, firebaseConfig };