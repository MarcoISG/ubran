import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// Configuración de desarrollo por defecto
const defaultConfig = {
  apiKey: "demo-api-key",
  authDomain: "ubran-demo.firebaseapp.com",
  projectId: "ubran-demo",
  storageBucket: "ubran-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:demo",
  measurementId: "G-DEMO"
};

// Usar variables de entorno si están disponibles, sino usar configuración de desarrollo
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || defaultConfig.measurementId
};

// Mostrar si estamos usando configuración de desarrollo
if (firebaseConfig.apiKey === defaultConfig.apiKey) {
  console.warn('⚠️ Usando configuración de Firebase de desarrollo. Para producción, configura las variables de entorno en .env.local');
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