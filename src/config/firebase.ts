import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { app } from '../firebaseConfig';

// Exporta instancias únicas basadas en la app real
export const auth = getAuth(app);
export const db = getFirestore(app);
