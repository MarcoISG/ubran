import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// Configuración de desarrollo por defecto
const defaultConfig = {
  apiKey: "AIzaSyDemo-Key-For-Development-Only",
  authDomain: "ubran-demo.firebaseapp.com",
  projectId: "ubran-demo",
  storageBucket: "ubran-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:demo",
  measurementId: "G-DEMO"
};

// Función para validar si una variable de entorno es válida
const isValidEnvVar = (value: string | undefined): boolean => {
  return value !== undefined && value !== 'y' && value !== '' && value.length > 5;
};

// Usar variables de entorno si están disponibles y son válidas, sino usar configuración de desarrollo
const firebaseConfig = {
  apiKey: isValidEnvVar(import.meta.env.VITE_FIREBASE_API_KEY) ? import.meta.env.VITE_FIREBASE_API_KEY : defaultConfig.apiKey,
  authDomain: isValidEnvVar(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN : defaultConfig.authDomain,
  projectId: isValidEnvVar(import.meta.env.VITE_FIREBASE_PROJECT_ID) ? import.meta.env.VITE_FIREBASE_PROJECT_ID : defaultConfig.projectId,
  storageBucket: isValidEnvVar(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET : defaultConfig.storageBucket,
  messagingSenderId: isValidEnvVar(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID : defaultConfig.messagingSenderId,
  appId: isValidEnvVar(import.meta.env.VITE_FIREBASE_APP_ID) ? import.meta.env.VITE_FIREBASE_APP_ID : defaultConfig.appId,
  measurementId: isValidEnvVar(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) ? import.meta.env.VITE_FIREBASE_MEASUREMENT_ID : defaultConfig.measurementId
};

// Mostrar información sobre la configuración actual
const usingDefaultConfig = firebaseConfig.apiKey === defaultConfig.apiKey;
if (usingDefaultConfig) {
  console.warn('⚠️ Usando configuración de Firebase de desarrollo. Para producción, configura las variables de entorno válidas.');
} else {
  console.log('✅ Usando configuración de Firebase de producción');
}

// En producción, mostrar advertencia si las variables no están configuradas correctamente
if (import.meta.env.PROD && usingDefaultConfig) {
  console.error('🚨 ADVERTENCIA: Aplicación en producción usando configuración de desarrollo. Configura las variables de entorno de Firebase.');
}

console.log('Firebase config loaded for project:', firebaseConfig.projectId);

export const app = initializeApp(firebaseConfig);

// Initialize Analytics only in production and when supported (browser)
let analyticsInstance: Analytics | undefined;
if (import.meta.env.PROD && typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analyticsInstance = getAnalytics(app);
      }
    })
    .catch(() => {
      // Silently ignore analytics init errors in unsupported/non-browser environments
    });
}
export const analytics = analyticsInstance;