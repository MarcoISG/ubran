import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Reemplaza esto con tu configuración de Firebase
  apiKey: "TU_API_KEY",
  authDomain: "tu-app.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-app.appspot.com",
  messagingSenderId: "tu-messaging-sender-id",
  appId: "tu-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
