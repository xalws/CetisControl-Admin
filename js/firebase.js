import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBLBLDR6UA0Mkz2rkYW2f_FYlIZrOdNPPg",
  authDomain: "cetiscontrol.firebaseapp.com",
  projectId: "cetiscontrol",
  storageBucket: "cetiscontrol.firebasestorage.app",
  messagingSenderId: "1030843858197",
  appId: "1:1030843858197:web:b0a269b2dba3691b7ebd1c",
  measurementId: "G-L5MGH8EGXM"
};

export const DOMINIO_USUARIOS = "cetis61.edu.mx";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);