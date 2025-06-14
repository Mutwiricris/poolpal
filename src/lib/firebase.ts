import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyChB7pS2BoG2f_OLkMnSMUYBNRAtffLJBY",
  authDomain: "poolbilliard-167ad.firebaseapp.com",
  projectId: "poolbilliard-167ad",
  storageBucket: "poolbilliard-167ad.firebasestorage.app",
  messagingSenderId: "754521057099",
  appId: "1:754521057099:web:c239444a3cb58f8021eace",
  measurementId: "G-PV33W2BRXR",
  databaseURL: "https://poolbilliard-167ad-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore and get a reference to the service
export const firestore = getFirestore(app);

// Initialize Realtime Database and get a reference to the service
// Note: Keeping this for other services that might still use it
export const database = getDatabase(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

// Initialize Analytics - only in browser environment
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
