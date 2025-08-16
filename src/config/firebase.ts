import { getAuth } from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork, connectFirestoreEmulator } from 'firebase/firestore';
import { app } from '../firebaseConfig';

// Exporta instancias únicas basadas en la app real
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configuración de conectividad mejorada
let isOnline = navigator.onLine;
let reconnectAttempts = 0;
const maxReconnectAttempts = 3;

// Monitorear estado de conectividad
window.addEventListener('online', async () => {
  console.log('Network connection restored');
  isOnline = true;
  reconnectAttempts = 0;
  
  try {
    await enableNetwork(db);
    console.log('Firestore reconnected successfully');
  } catch (error) {
    console.warn('Failed to reconnect Firestore:', error);
  }
});

window.addEventListener('offline', async () => {
  console.log('Network connection lost');
  isOnline = false;
  
  try {
    await disableNetwork(db);
    console.log('Firestore switched to offline mode');
  } catch (error) {
    console.warn('Failed to disable Firestore network:', error);
  }
});

// Función para verificar y restaurar conectividad
export const ensureFirestoreConnection = async (): Promise<boolean> => {
  if (!isOnline && reconnectAttempts < maxReconnectAttempts) {
    reconnectAttempts++;
    console.log(`Attempting to reconnect Firestore (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
    
    try {
      await enableNetwork(db);
      isOnline = true;
      reconnectAttempts = 0;
      console.log('Firestore connection restored');
      return true;
    } catch (error) {
      console.warn(`Reconnection attempt ${reconnectAttempts} failed:`, error);
      return false;
    }
  }
  
  return isOnline;
};

export { isOnline };
