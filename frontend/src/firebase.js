import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDtmEPCqWQbiUcdeGCY17X5iweLCIYLbc8",
  authDomain: "blueguardc.firebaseapp.com",
  projectId: "blueguardc",
  storageBucket: "blueguardc.firebasestorage.app",
  messagingSenderId: "901631735050",
  appId: "1:901631735050:web:80df5946328db53a7136f3",
  measurementId: "G-0Z00ECC7KV"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;