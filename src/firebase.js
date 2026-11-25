import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCdlbRfTzPoYvZPwkwqsSsdeiDU9LsfPCM",
  authDomain: "wo-engineering.firebaseapp.com",
  projectId: "wo-engineering",
  storageBucket: "wo-engineering.firebasestorage.app",
  messagingSenderId: "542225397491",
  appId: "1:542225397491:web:4677ed0743912c512be986"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
