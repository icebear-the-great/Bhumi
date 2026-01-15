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

export const db = {
  
  // --- INITIALIZATION ---
  init: async () => {
    if (!firestore) return; // Skip if no DB connection

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
    if (!firestore) return MOCK_USERS;
    try {
        const snapshot = await getDocs(collection(firestore, COLLECTIONS.USERS));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
    } catch (e) {
        return MOCK_USERS; 
    }
  },

  addUser: async (user: User): Promise<User[]> => {
    if (!firestore) {
        MOCK_USERS.push(user);
        return [...MOCK_USERS];
    }
    await setDoc(doc(firestore, COLLECTIONS.USERS, user.email), user);
    return db.getUsers();
  },

  updateUserStatus: async (id: string, status: 'Active' | 'Inactive'): Promise<User[]> => {
    if (!firestore) return MOCK_USERS; // Demo mode: no persistence
    await updateDoc(doc(firestore, COLLECTIONS.USERS, id), { status });
    return db.getUsers();
  },

  resetUserPassword: async (id: string): Promise<User[]> => {
    console.log("Password reset triggered for", id);
    return db.getUsers();
  },

  // --- IDEAS ---
  getIdeas: async (): Promise<Idea[]> => {
    if (!firestore) return MOCK_IDEAS;
    try {
        const q = query(collection(firestore, COLLECTIONS.IDEAS));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => {
            const data = convertTimestamps(d.data());
            return { id: d.id, ...data } as Idea;
        });
    } catch (e) { return MOCK_IDEAS; }
  },

  saveIdea: async (idea: Idea): Promise<Idea> => {
    if (!firestore) return idea; // Demo mode
    const { id, ...rest } = idea;
    const docRef = await addDoc(collection(firestore, COLLECTIONS.IDEAS), rest);
    return { ...idea, id: docRef.id };
  },

  updateIdea: async (idea: Idea): Promise<Idea> => {
      if (!firestore) return idea;
      const { id, ...rest } = idea;
      await updateDoc(doc(firestore, COLLECTIONS.IDEAS, id), rest);
      return idea;
  },

  deleteIdea: async (id: string): Promise<void> => {
      if (!firestore) return;
      await deleteDoc(doc(firestore, COLLECTIONS.IDEAS, id));
  },

  // --- CAMPAIGNS ---
  getCampaigns: async (): Promise<Campaign[]> => {
      if (!firestore) return MOCK_CAMPAIGNS;
      try {
        const snapshot = await getDocs(collection(firestore, COLLECTIONS.CAMPAIGNS));
        return snapshot.docs.map(d => {
            const data = convertTimestamps(d.data());
            return { id: d.id, ...data } as Campaign;
        });
      } catch (e) { return MOCK_CAMPAIGNS; }
  },

  saveCampaign: async (campaign: Campaign): Promise<Campaign> => {
      if (!firestore) return campaign;
      const { id, ...rest } = campaign;
      const docRef = await addDoc(collection(firestore, COLLECTIONS.CAMPAIGNS), rest);
      return { ...campaign, id: docRef.id };
  },

  updateCampaign: async (campaign: Campaign): Promise<Campaign> => {
      if (!firestore) return campaign;
      const { id, ...rest } = campaign;
      await updateDoc(doc(firestore, COLLECTIONS.CAMPAIGNS, id), rest);
      return campaign;
  },

  // --- CONFIG ---
  getConfig: async (): Promise<AppConfig> => {
    if (!firestore) return { categories: DEFAULT_CATEGORIES, roles: DEFAULT_ROLES, channels: DEFAULT_CHANNELS };
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
    if (!firestore) return;
    await setDoc(doc(firestore, COLLECTIONS.CONFIG, 'main'), config);
  },

  // --- AUTH ---
  login: async (email: string, password: string): Promise<User | null> => {
    if (!auth || !firestore) {
        // Mock Login for Demo Mode
        const mockUser = MOCK_USERS.find(u => u.email === email);
        if (mockUser && password === 'welcome123') {
             localStorage.setItem('bhumi_session', JSON.stringify(mockUser));
             return mockUser;
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
             return {
                 id: firebaseUser.uid,
                 email: firebaseUser.email || '',
                 name: firebaseUser.displayName || 'User',
                 role: 'Contributor',
                 status: 'Active'
             };
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
