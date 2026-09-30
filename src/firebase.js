import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCUNen9Bywm3fn0nGIKpaRenfGT3lE2HXU",
  authDomain: "ai-shopping-fo-bugecting.firebaseapp.com",
  projectId: "ai-shopping-fo-bugecting",
  storageBucket: "ai-shopping-fo-bugecting.firebasestorage.app",
  messagingSenderId: "983414497925",
  appId: "1:983414497925:web:d411147bc80e55bda47fec",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);