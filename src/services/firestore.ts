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
import { db, ensureFirestoreConnection, isOnline } from '../config/firebase';
import type { Entry, Vehicle, Goal, FixedExpense, Maintenance, Route, Statistics } from '../types/models';

// Utilidad para manejar errores de conectividad
const handleFirestoreError = async (error: any, operation: string) => {
  console.warn(`Firestore ${operation} error:`, error);
  
  // Si es un error de red, intentar reconectar
  if (error.code === 'unavailable' || error.message?.includes('ERR_ABORTED') || error.message?.includes('net::')) {
    console.log('Network error detected, attempting to restore connection...');
    const reconnected = await ensureFirestoreConnection();
    
    if (!reconnected) {
      console.log('Unable to restore connection, operating in offline mode');
      // Mostrar notificación al usuario sobre el modo offline
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          new Notification('Ubran - Modo Offline', {
            body: 'Sin conexión a internet. Los datos se sincronizarán cuando se restaure la conexión.',
            icon: '/icons/icon-192.png'
          });
        } catch (e) {
          console.log('Notification permission not granted');
        }
      }
    }
  }
  
  throw error;
};

// Utilidad para reintentar operaciones
const retryOperation = async <T>(operation: () => Promise<T>, maxRetries = 2): Promise<T> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw new Error('Max retries exceeded');
};

// Entradas diarias
export const entryService = {
  getAll: async (userId: string) => {
    try {
      return await retryOperation(async () => {
        const q = query(
          collection(db, 'entries'),
          where('userId', '==', userId),
          orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Entry));
      });
    } catch (error) {
       await handleFirestoreError(error, 'getAll entries');
       return [];
     }
  },

  create: async (userId: string, data: Omit<Entry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      return await retryOperation(async () => {
        const now = Timestamp.now();
        const entry = {
          ...data,
          userId,
          createdAt: now,
          updatedAt: now
        };
        const docRef = await addDoc(collection(db, 'entries'), entry);
        return { id: docRef.id, ...entry };
      });
    } catch (error) {
       await handleFirestoreError(error, 'create entry');
       throw error;
     }
  },

  update: async (id: string, data: Partial<Entry>) => {
    try {
      await retryOperation(async () => {
        const ref = doc(db, 'entries', id);
        await updateDoc(ref, { ...data, updatedAt: Timestamp.now() });
      });
    } catch (error) {
       await handleFirestoreError(error, 'update entry');
       throw error;
     }
  },

  delete: async (id: string) => {
    try {
      await retryOperation(async () => {
        await deleteDoc(doc(db, 'entries', id));
      });
    } catch (error) {
       await handleFirestoreError(error, 'delete entry');
       throw error;
     }
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
    try {
      return await retryOperation(async () => {
        const ref = doc(db, 'statistics', `${userId}_${period}`);
        const snapshot = await getDoc(ref);
        return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Statistics : null;
      });
    } catch (error) {
       await handleFirestoreError(error, 'getMonthly statistics');
       return null;
     }
  },

  upsertMonthly: async (userId: string, period: string, data: Partial<Statistics>) => {
    try {
      return await retryOperation(async () => {
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
      });
    } catch (error) {
       await handleFirestoreError(error, 'upsertMonthly statistics');
       throw error;
     }
  }
};
