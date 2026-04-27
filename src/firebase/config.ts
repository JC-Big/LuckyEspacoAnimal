import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBU9vDhMJSdDJ1q55ZpeehMhfQVWactASk",
  authDomain: "lucky-animals.firebaseapp.com",
  projectId: "lucky-animals",
  storageBucket: "lucky-animals.firebasestorage.app",
  messagingSenderId: "886869833233",
  appId: "1:886869833233:web:8fbf4ab1bcdb54862ca3b0"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
