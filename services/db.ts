import { User, AppConfig, Idea, Campaign } from '../types';
import { MOCK_USERS, MOCK_IDEAS, MOCK_CAMPAIGNS, DEFAULT_CATEGORIES, DEFAULT_ROLES, DEFAULT_CHANNELS } from '../constants';
import { firestore, auth, getIsDemoMode, firebaseConfig } from './firebaseConfig';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  getDoc,
  query
} from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, getAuth as getAuthFromApp } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';

const COLLECTIONS = {
  USERS: 'users',
  CONFIG: 'config',
  IDEAS: 'ideas',
  CAMPAIGNS: 'campaigns'
};

const LS_KEYS = {
    USERS: 'bhumi_data_users',
    IDEAS: 'bhumi_data_ideas',
    CAMPAIGNS: 'bhumi_data_campaigns',
    CONFIG: 'bhumi_data_config'
};

// Helper to remove undefined fields which Firestore hates
const sanitize = (obj: any): any => {
    return JSON.parse(JSON.stringify(obj, (key, value) => {
        return value === undefined ? null : value;
    }));
};

// Helper to convert Firestore Timestamps to Dates
const convertTimestamps = (data: any): any => {
  if (data === null || data === undefined) return data;
  if (typeof data === 'object') {
    if (data.seconds !== undefined && data.nanoseconds !== undefined) {
      return new Date(data.seconds * 1000);
    }
    if (Array.isArray(data)) {
      return data.map(convertTimestamps);
    }
    const newData: any = {};
    for (const key in data) {
      newData[key] = convertTimestamps(data[key]);
    }
    return newData;
  }
  return data;
};

// Helper to revive dates from JSON (LocalStorage)
const reviveDates = (key: any, value: any) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return new Date(value);
    }
    return value;
};

const getLocal = <T>(key: string, defaultVal: T): T => {
    try {
        const stored = localStorage.getItem(key);
        if (!stored) return defaultVal;
        return JSON.parse(stored, reviveDates) as T;
    } catch {
        return defaultVal;
    }
};

const setLocal = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Local Storage Error", e);
    }
};

export const db = {
  get isDemo() {
      return !firestore;
  },
  
  // --- INITIALIZATION ---
  init: async () => {
    if (!firestore) {
        // Initialize Local Storage with Mock Data if empty
        if (!localStorage.getItem(LS_KEYS.USERS)) setLocal(LS_KEYS.USERS, MOCK_USERS);
        if (!localStorage.getItem(LS_KEYS.IDEAS)) setLocal(LS_KEYS.IDEAS, MOCK_IDEAS);
        if (!localStorage.getItem(LS_KEYS.CAMPAIGNS)) setLocal(LS_KEYS.CAMPAIGNS, MOCK_CAMPAIGNS);
        if (!localStorage.getItem(LS_KEYS.CONFIG)) setLocal(LS_KEYS.CONFIG, { categories: DEFAULT_CATEGORIES, roles: DEFAULT_ROLES, channels: DEFAULT_CHANNELS });
        return true;
    }

    try {
        const configRef = doc(firestore, COLLECTIONS.CONFIG, 'main');
        // We use try/catch here specifically for the read to handle permission errors gracefully on init
        try {
            const configSnap = await getDoc(configRef);
            
            if (!configSnap.exists()) {
                console.log("Seeding Database...");
                await setDoc(configRef, {
                    categories: DEFAULT_CATEGORIES,
                    roles: DEFAULT_ROLES,
                    channels: DEFAULT_CHANNELS
                });
                
                // Seed Users (Profiles only)
                for (const user of MOCK_USERS) {
                    await setDoc(doc(firestore, COLLECTIONS.USERS, user.email), user);
                }

                // Seed Ideas
                for (const idea of MOCK_IDEAS) {
                    const { id, ...rest } = idea;
                    await setDoc(doc(firestore, COLLECTIONS.IDEAS, id), sanitize(rest));
                }

                // Seed Campaigns
                for (const camp of MOCK_CAMPAIGNS) {
                    const { id, ...rest } = camp;
                    await setDoc(doc(firestore, COLLECTIONS.CAMPAIGNS, id), sanitize(rest));
                }
            }
        } catch (readError: any) {
            console.warn("DB Init: Could not read/seed database. This is expected if security rules block unauthenticated access.", readError.message);
            // Do not re-throw, allow app to continue so user can log in
        }
    } catch (e) {
        console.error("Error initializing DB:", e);
    }
    return true;
  },

  // --- USERS ---
  getUsers: async (): Promise<User[]> => {
    if (!firestore) return getLocal(LS_KEYS.USERS, MOCK_USERS);
    try {
        const snapshot = await getDocs(collection(firestore, COLLECTIONS.USERS));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
    } catch (e) {
        // If permission denied, return empty or fallback to local mock prevents app crash
        console.warn("getUsers failed:", e);
        return []; 
    }
  },

  addUser: async (user: User): Promise<User[]> => {
    if (!firestore) {
        const current = getLocal<User[]>(LS_KEYS.USERS, MOCK_USERS);
        const updated = [...current, user];
        setLocal(LS_KEYS.USERS, updated);
        return updated;
    }

    // 1. Create User in Firestore (Profile)
    await setDoc(doc(firestore, COLLECTIONS.USERS, user.email), sanitize(user));

    // 2. Create User in Firebase Auth
    // We must use a secondary app instance to avoid logging out the current admin user
    if (user.password && firebaseConfig && firebaseConfig.apiKey) {
        let secondaryApp;
        try {
            secondaryApp = initializeApp(firebaseConfig, "Secondary");
            const secondaryAuth = getAuthFromApp(secondaryApp);
            await createUserWithEmailAndPassword(secondaryAuth, user.email, user.password);
            
            // Clean up: Sign out secondary and delete app
            await signOut(secondaryAuth);
            console.log("User created in Firebase Auth successfully");
        } catch (e: any) {
            console.error("Failed to create user in Auth:", e);
            if (e.code === 'auth/email-already-in-use') {
                console.warn("User already exists in Auth, proceeding with DB update.");
            } else {
                // If it's a permission error or something else, we let the UI know via toast in component
                throw e;
            }
        } finally {
            if (secondaryApp) {
                await deleteApp(secondaryApp);
            }
        }
    }

    return db.getUsers();
  },

  updateUserStatus: async (id: string, status: 'Active' | 'Inactive'): Promise<User[]> => {
    if (!firestore) {
        const current = getLocal<User[]>(LS_KEYS.USERS, MOCK_USERS);
        const updated = current.map(u => u.id === id ? { ...u, status } : u);
        setLocal(LS_KEYS.USERS, updated);
        return updated;
    }
    await updateDoc(doc(firestore, COLLECTIONS.USERS, id), { status });
    return db.getUsers();
  },

  resetUserPassword: async (id: string): Promise<User[]> => {
    console.log("Password reset triggered for", id);
    // Note: Admin SDK is required to reset passwords programmatically without knowing the old one.
    // In a client-only app, we typically send a password reset email via auth.sendPasswordResetEmail(email)
    return db.getUsers();
  },

  // --- IDEAS ---
  getIdeas: async (): Promise<Idea[]> => {
    if (!firestore) return getLocal(LS_KEYS.IDEAS, MOCK_IDEAS);
    try {
        const q = query(collection(firestore, COLLECTIONS.IDEAS));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => {
            const data = convertTimestamps(d.data());
            return { id: d.id, ...data } as Idea;
        });
    } catch (e) { return []; }
  },

  saveIdea: async (idea: Idea): Promise<Idea> => {
    if (!firestore) {
        const current = getLocal<Idea[]>(LS_KEYS.IDEAS, MOCK_IDEAS);
        const updated = [idea, ...current];
        setLocal(LS_KEYS.IDEAS, updated);
        return idea;
    }
    const { id, ...rest } = idea;
    // Sanitize to remove undefined
    const cleanData = sanitize(rest);
    const docRef = await addDoc(collection(firestore, COLLECTIONS.IDEAS), cleanData);
    return { ...idea, id: docRef.id };
  },

  updateIdea: async (idea: Idea): Promise<Idea> => {
      if (!firestore) {
          const current = getLocal<Idea[]>(LS_KEYS.IDEAS, MOCK_IDEAS);
          const updated = current.map(i => i.id === idea.id ? idea : i);
          setLocal(LS_KEYS.IDEAS, updated);
          return idea;
      }
      const { id, ...rest } = idea;
      await updateDoc(doc(firestore, COLLECTIONS.IDEAS, id), sanitize(rest));
      return idea;
  },

  deleteIdea: async (id: string): Promise<void> => {
      if (!firestore) {
          const current = getLocal<Idea[]>(LS_KEYS.IDEAS, MOCK_IDEAS);
          const updated = current.filter(i => i.id !== id);
          setLocal(LS_KEYS.IDEAS, updated);
          return;
      }
      await deleteDoc(doc(firestore, COLLECTIONS.IDEAS, id));
  },

  // --- CAMPAIGNS ---
  getCampaigns: async (): Promise<Campaign[]> => {
      if (!firestore) return getLocal(LS_KEYS.CAMPAIGNS, MOCK_CAMPAIGNS);
      try {
        const snapshot = await getDocs(collection(firestore, COLLECTIONS.CAMPAIGNS));
        return snapshot.docs.map(d => {
            const data = convertTimestamps(d.data());
            return { id: d.id, ...data } as Campaign;
        });
      } catch (e) { return []; }
  },

  saveCampaign: async (campaign: Campaign): Promise<Campaign> => {
      if (!firestore) {
          const current = getLocal<Campaign[]>(LS_KEYS.CAMPAIGNS, MOCK_CAMPAIGNS);
          const updated = [campaign, ...current];
          setLocal(LS_KEYS.CAMPAIGNS, updated);
          return campaign;
      }
      const { id, ...rest } = campaign;
      const docRef = await addDoc(collection(firestore, COLLECTIONS.CAMPAIGNS), sanitize(rest));
      return { ...campaign, id: docRef.id };
  },

  updateCampaign: async (campaign: Campaign): Promise<Campaign> => {
      if (!firestore) {
          const current = getLocal<Campaign[]>(LS_KEYS.CAMPAIGNS, MOCK_CAMPAIGNS);
          const updated = current.map(c => c.id === campaign.id ? campaign : c);
          setLocal(LS_KEYS.CAMPAIGNS, updated);
          return campaign;
      }
      const { id, ...rest } = campaign;
      await updateDoc(doc(firestore, COLLECTIONS.CAMPAIGNS, id), sanitize(rest));
      return campaign;
  },

  // --- CONFIG ---
  getConfig: async (): Promise<AppConfig> => {
    if (!firestore) return getLocal(LS_KEYS.CONFIG, { categories: DEFAULT_CATEGORIES, roles: DEFAULT_ROLES, channels: DEFAULT_CHANNELS });
    try {
      const docRef = doc(firestore, COLLECTIONS.CONFIG, 'main');
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
          return snapshot.data() as AppConfig;
      }
      return { categories: DEFAULT_CATEGORIES, roles: DEFAULT_ROLES, channels: DEFAULT_CHANNELS };
    } catch {
      return { categories: DEFAULT_CATEGORIES, roles: DEFAULT_ROLES, channels: DEFAULT_CHANNELS };
    }
  },

  saveConfig: async (config: AppConfig) => {
    if (!firestore) {
        setLocal(LS_KEYS.CONFIG, config);
        return;
    }
    await setDoc(doc(firestore, COLLECTIONS.CONFIG, 'main'), sanitize(config));
  },

  // --- AUTH ---
  login: async (email: string, password: string): Promise<User | null> => {
    if (!auth || !firestore) {
        // Local Mode Login logic remains same
        const localUsers = getLocal<User[]>(LS_KEYS.USERS, MOCK_USERS);
        const user = localUsers.find(u => u.email === email);
        if (user && (password === 'welcome123' || user.password === password)) {
             localStorage.setItem('bhumi_session', JSON.stringify(user));
             return user;
        }
        return null;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        let userData: User | null = null;
        
        // Try to fetch user profile, BUT allow failure if permissions are denied
        try {
            const docRef = doc(firestore, COLLECTIONS.USERS, email); 
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                userData = docSnap.data() as User;
            }
        } catch (readError) {
            console.warn("Login: Firestore profile read failed. Likely permission issue. Fallback to Auth data.", readError);
            // We ignore this error to allow the user to log in based on Auth success
        }

        if (userData && userData.status === 'Inactive') return null;
        
        // Construct user object (either from DB or from Auth)
        const fullUser = userData ? { ...userData, id: firebaseUser.uid } : {
             id: firebaseUser.uid,
             email: firebaseUser.email || '',
             name: firebaseUser.displayName || email.split('@')[0],
             role: 'Contributor', // Default Role
             status: 'Active' as const
        };
        
        localStorage.setItem('bhumi_session', JSON.stringify(fullUser));
        return fullUser;

    } catch (e) {
        console.error("Login failed:", e);
        throw e;
    }
  },

  logout: async () => {
    if (auth) await signOut(auth);
    localStorage.removeItem('bhumi_session');
  },

  getSession: (): User | null => {
    try {
      const stored = localStorage.getItem('bhumi_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
};
