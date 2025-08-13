import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types/models';

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Crear el documento del usuario
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        name,
        email,
        createdAt: new Date(),
        settings: {
          tax: 0.14,
          maintPerHour: 500,
          incTax: true,
          incFuel: true,
          incMaint: true,
          useFuelByKm: true,
          subFixed: false,
          favPlace: ""
        }
      });

      return user;
    } catch (error) {
      console.error('Error en signup:', error);
      throw error;
    }
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  return {
    user,
    loading,
    signup,
    login,
    logout
  };
}
