import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyApQzLZ8LaW01pq5l-WruIhJzfSpe9sh2k",
  authDomain: "ubran-c29d3.firebaseapp.com",
  projectId: "ubran-c29d3",
  storageBucket: "ubran-c29d3.firebasestorage.app",
  messagingSenderId: "131691494187",
  appId: "1:131691494187:web:4a9e6753388a87baa8236e",
  measurementId: "G-6GW039CQM6"
};

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