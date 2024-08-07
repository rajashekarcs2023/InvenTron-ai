// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getFirestore} from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD4GqKmD5ggGRrx81mLg1NHHs0Wo6Z7yPA",
  authDomain: "inventory-management-ai-app.firebaseapp.com",
  projectId: "inventory-management-ai-app",
  storageBucket: "inventory-management-ai-app.appspot.com",
  messagingSenderId: "503435343709",
  appId: "1:503435343709:web:b92b0c5ab0fb97d4f75ab4",
  measurementId: "G-6R0V6VBCBR"
};

// Initialize Firebase


let app;
let analytics;
let db;

if (typeof window !== 'undefined') {
  app = initializeApp(firebaseConfig);
  analytics = getAnalytics(app); // Optional: Remove if you don't use Analytics
  db = getFirestore(app);
}

export {db};