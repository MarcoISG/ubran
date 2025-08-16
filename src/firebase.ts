import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyApQzLZ8LaW01pq5l-WruIhJzfSpe9sh2k",
  authDomain: "ubran-c29d3.firebaseapp.com",
  projectId: "ubran-c29d3",
  storageBucket: "ubran-c29d3.appspot.com",
  messagingSenderId: "131691494187",
  appId: "1:131691494187:web:4a9e6753388a87baa8236e",
  measurementId: "G-6GW039CQM6"
};

// Inicializar Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error('Error al inicializar Firebase:', error);
  throw error;
}

// Inicializar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
let messaging: any;

try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn('Messaging no disponible:', error);
  messaging = null;
}

// Verificar la inicialización
if (!auth || !db) {
  throw new Error('Firebase no se inicializó correctamente');
}

// Autenticación
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const registerWithEmail = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Notificaciones
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging);
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

// Operaciones con Gastos
export const addExpense = async (userId: string, expense: any) => {
  try {
    const expensesRef = collection(db, 'expenses');
    const docRef = await addDoc(expensesRef, {
      ...expense,
      userId,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updateExpense = async (expenseId: string, data: any) => {
  try {
    const expenseRef = doc(db, 'expenses', expenseId);
    await updateDoc(expenseRef, {
      ...data,
      updatedAt: new Date()
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const deleteExpense = async (expenseId: string) => {
  try {
    const expenseRef = doc(db, 'expenses', expenseId);
    await deleteDoc(expenseRef);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getExpenses = async (userId: string) => {
  try {
    const expensesRef = collection(db, 'expenses');
    const q = query(expensesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Operaciones con Vehículos
export const addVehicle = async (userId: string, vehicle: any) => {
  try {
    const vehiclesRef = collection(db, 'vehicles');
    const docRef = await addDoc(vehiclesRef, {
      ...vehicle,
      userId,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updateVehicle = async (vehicleId: string, data: any) => {
  try {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(vehicleRef, {
      ...data,
      updatedAt: new Date()
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const deleteVehicle = async (vehicleId: string) => {
  try {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    await deleteDoc(vehicleRef);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getVehicles = async (userId: string) => {
  try {
    const vehiclesRef = collection(db, 'vehicles');
    const q = query(vehiclesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Operaciones con Metas
export const addGoal = async (userId: string, goal: any) => {
  try {
    const goalsRef = collection(db, 'goals');
    const docRef = await addDoc(goalsRef, {
      ...goal,
      userId,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updateGoal = async (goalId: string, data: any) => {
  try {
    const goalRef = doc(db, 'goals', goalId);
    await updateDoc(goalRef, {
      ...data,
      updatedAt: new Date()
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const deleteGoal = async (goalId: string) => {
  try {
    const goalRef = doc(db, 'goals', goalId);
    await deleteDoc(goalRef);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getGoals = async (userId: string) => {
  try {
    const goalsRef = collection(db, 'goals');
    const q = query(goalsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error: any) {
    throw new Error(error.message);
  }
};
