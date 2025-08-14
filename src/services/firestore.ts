import { 
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Entry, Vehicle, Goal, FixedExpense, Maintenance, Route, Statistics } from '../types/models';

// Entradas diarias
export const entryService = {
  getAll: async (userId: string) => {
    const q = query(
      collection(db, 'entries'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Entry));
  },

  create: async (userId: string, data: Omit<Entry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const now = Timestamp.now();
    const entry = {
      ...data,
      userId,
      createdAt: now,
      updatedAt: now
    };
    const docRef = await addDoc(collection(db, 'entries'), entry);
    return { id: docRef.id, ...entry };
  },

  update: async (id: string, data: Partial<Entry>) => {
    const ref = doc(db, 'entries', id);
    await updateDoc(ref, { ...data, updatedAt: Timestamp.now() });
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, 'entries', id));
  }
};

// Vehículos
export const vehicleService = {
  getAll: async (userId: string) => {
    const q = query(
      collection(db, 'vehicles'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
  },

  create: async (userId: string, data: Omit<Vehicle, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const now = Timestamp.now();
    const vehicle = {
      ...data,
      userId,
      createdAt: now,
      updatedAt: now
    };
    const docRef = await addDoc(collection(db, 'vehicles'), vehicle);
    return { id: docRef.id, ...vehicle };
  },

  update: async (id: string, data: Partial<Vehicle>) => {
    const ref = doc(db, 'vehicles', id);
    await updateDoc(ref, { ...data, updatedAt: Timestamp.now() });
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, 'vehicles', id));
  }
};

// Metas
export const goalService = {
  getAll: async (userId: string) => {
    const q = query(
      collection(db, 'goals'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
  },

  create: async (userId: string, data: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const now = Timestamp.now();
    const goal = {
      ...data,
      userId,
      createdAt: now,
      updatedAt: now
    };
    const docRef = await addDoc(collection(db, 'goals'), goal);
    return { id: docRef.id, ...goal };
  },

  update: async (id: string, data: Partial<Goal>) => {
    const ref = doc(db, 'goals', id);
    await updateDoc(ref, { ...data, updatedAt: Timestamp.now() });
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, 'goals', id));
  }
};

// Gastos Fijos
export const expenseService = {
  getAll: async (userId: string) => {
    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FixedExpense));
  },

  create: async (userId: string, data: Omit<FixedExpense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const now = Timestamp.now();
    const expense = {
      ...data,
      userId,
      createdAt: now,
      updatedAt: now
    };
    const docRef = await addDoc(collection(db, 'expenses'), expense);
    return { id: docRef.id, ...expense };
  },

  update: async (id: string, data: Partial<FixedExpense>) => {
    const ref = doc(db, 'expenses', id);
    await updateDoc(ref, { ...data, updatedAt: Timestamp.now() });
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, 'expenses', id));
  }
};

// Mantenimientos
export const maintenanceService = {
  getAll: async (userId: string) => {
    const q = query(
      collection(db, 'maintenance'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Maintenance));
  },

  create: async (userId: string, data: Omit<Maintenance, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const now = Timestamp.now();
    const maintenance = {
      ...data,
      userId,
      createdAt: now,
      updatedAt: now
    };
    const docRef = await addDoc(collection(db, 'maintenance'), maintenance);
    return { id: docRef.id, ...maintenance };
  },

  update: async (id: string, data: Partial<Maintenance>) => {
    const ref = doc(db, 'maintenance', id);
    await updateDoc(ref, { ...data, updatedAt: Timestamp.now() });
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, 'maintenance', id));
  }
};

// Rutas
export const routeService = {
  getAll: async (userId: string) => {
    const q = query(
      collection(db, 'routes'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Route));
  },

  create: async (userId: string, data: Omit<Route, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const now = Timestamp.now();
    const route = {
      ...data,
      userId,
      createdAt: now,
      updatedAt: now
    };
    const docRef = await addDoc(collection(db, 'routes'), route);
    return { id: docRef.id, ...route };
  },

  update: async (id: string, data: Partial<Route>) => {
    const ref = doc(db, 'routes', id);
    await updateDoc(ref, { ...data, updatedAt: Timestamp.now() });
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, 'routes', id));
  }
};

// Estadísticas
export const statsService = {
  getMonthly: async (userId: string, period: string) => {
    const ref = doc(db, 'statistics', `${userId}_${period}`);
    const snapshot = await getDoc(ref);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Statistics : null;
  },

  upsertMonthly: async (userId: string, period: string, data: Partial<Statistics>) => {
    const now = Timestamp.now();
    const ref = doc(db, 'statistics', `${userId}_${period}`);
    const stats = {
      ...data,
      userId,
      period,
      updatedAt: now
    };
    await setDoc(ref, stats, { merge: true });
    return { id: ref.id, ...stats };
  }
};
