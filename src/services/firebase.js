// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBYbUwKCaTWnaAOJ3dS6mibdiTPKV7sHe8",
  authDomain: "claudes-poker-game.firebaseapp.com",
  projectId: "claudes-poker-game",
  storageBucket: "claudes-poker-game.firebasestorage.app",
  databaseURL: "https://claudes-poker-game-default-rtdb.firebaseio.com",
  messagingSenderId: "458107205037",
  appId: "1:458107205037:web:3eba5d4e29747a5763dd24",
  measurementId: "G-RVDWMKCR2V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const database = getDatabase(app);

export { app, auth, firestore, database };