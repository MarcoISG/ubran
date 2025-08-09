import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

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
export const analytics = getAnalytics(app);