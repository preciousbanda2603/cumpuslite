// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAzQTXfph0F_0Kz0TcqwBRABuPkUxSLpHE",
  authDomain: "studio-1128359683-584e7.firebaseapp.com",
  databaseURL: "https://studio-1128359683-584e7-default-rtdb.firebaseio.com",
  projectId: "studio-1128359683-584e7",
  storageBucket: "studio-1128359683-584e7.appspot.com",
  messagingSenderId: "259318221895",
  appId: "1:259318221895:web:266ba401a76ed86e10f562"
};


// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const database = getDatabase(app);

// Set authentication persistence
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
      console.error("Error setting authentication persistence:", error);
    });
}


export { app, auth, db, storage, database };
