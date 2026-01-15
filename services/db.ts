import { User, AppConfig, Idea, Campaign } from '../types';
import { MOCK_USERS, MOCK_IDEAS, MOCK_CAMPAIGNS, DEFAULT_CATEGORIES, DEFAULT_ROLES, DEFAULT_CHANNELS } from '../constants';
import { firestore, auth } from './firebaseConfig';
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
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

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
                 await setDoc(doc(firestore, COLLECTIONS.IDEAS, id), rest);
            }

            // Seed Campaigns
             for (const camp of MOCK_CAMPAIGNS) {
                 const { id, ...rest } = camp;
                 await setDoc(doc(firestore, COLLECTIONS.CAMPAIGNS, id), rest);
            }
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
        return getLocal(LS_KEYS.USERS, MOCK_USERS); 
    }
  },

  addUser: async (user: User): Promise<User[]> => {
    if (!firestore) {
        const current = getLocal<User[]>(LS_KEYS.USERS, MOCK_USERS);
        const updated = [...current, user];
        setLocal(LS_KEYS.USERS, updated);
        return updated;
    }
    await setDoc(doc(firestore, COLLECTIONS.USERS, user.email), user);
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
    // In a real app, this would use Admin SDK or Cloud Function.
    // For demo/local, we just log it.
    console.log("Password reset triggered for", id);
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
    } catch (e) { return getLocal(LS_KEYS.IDEAS, MOCK_IDEAS); }
  },

  saveIdea: async (idea: Idea): Promise<Idea> => {
    if (!firestore) {
        const current = getLocal<Idea[]>(LS_KEYS.IDEAS, MOCK_IDEAS);
        const updated = [idea, ...current];
        setLocal(LS_KEYS.IDEAS, updated);
        return idea;
    }
    const { id, ...rest } = idea;
    const docRef = await addDoc(collection(firestore, COLLECTIONS.IDEAS), rest);
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
      await updateDoc(doc(firestore, COLLECTIONS.IDEAS, id), rest);
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
      } catch (e) { return getLocal(LS_KEYS.CAMPAIGNS, MOCK_CAMPAIGNS); }
  },

  saveCampaign: async (campaign: Campaign): Promise<Campaign> => {
      if (!firestore) {
          const current = getLocal<Campaign[]>(LS_KEYS.CAMPAIGNS, MOCK_CAMPAIGNS);
          const updated = [campaign, ...current];
          setLocal(LS_KEYS.CAMPAIGNS, updated);
          return campaign;
      }
      const { id, ...rest } = campaign;
      const docRef = await addDoc(collection(firestore, COLLECTIONS.CAMPAIGNS), rest);
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
      await updateDoc(doc(firestore, COLLECTIONS.CAMPAIGNS, id), rest);
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
      return getLocal(LS_KEYS.CONFIG, { categories: DEFAULT_CATEGORIES, roles: DEFAULT_ROLES, channels: DEFAULT_CHANNELS });
    }
  },

  saveConfig: async (config: AppConfig) => {
    if (!firestore) {
        setLocal(LS_KEYS.CONFIG, config);
        return;
    }
    await setDoc(doc(firestore, COLLECTIONS.CONFIG, 'main'), config);
  },

  // --- AUTH ---
  login: async (email: string, password: string): Promise<User | null> => {
    if (!auth || !firestore) {
        // Local Mode Login
        const localUsers = getLocal<User[]>(LS_KEYS.USERS, MOCK_USERS);
        const user = localUsers.find(u => u.email === email);
        
        // Simple mock password check (in real app, hash check needed)
        // For this demo, we accept 'welcome123' or the user's stored password if we added one (though User type doesn't stricly enforce password field security here)
        if (user && (password === 'welcome123' || user.password === password)) {
             localStorage.setItem('bhumi_session', JSON.stringify(user));
             return user;
        }
        return null;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        const docRef = doc(firestore, COLLECTIONS.USERS, email); 
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const userData = docSnap.data() as User;
            if (userData.status === 'Inactive') return null;
            const fullUser = { ...userData, id: firebaseUser.uid };
            localStorage.setItem('bhumi_session', JSON.stringify(fullUser));
            return fullUser;
        } else {
             // First time login sync if auth exists but firestore doc doesn't? 
             // Ideally we shouldn't reach here in this specific app logic unless auto-registration,
             // but let's return a basic user.
             const newUser: User = {
                 id: firebaseUser.uid,
                 email: firebaseUser.email || '',
                 name: firebaseUser.displayName || 'User',
                 role: 'Contributor',
                 status: 'Active'
             };
             return newUser;
        }
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
