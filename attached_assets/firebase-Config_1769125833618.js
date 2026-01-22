// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB4mFuHcmt0sQyQpLWEbNhhtvUGlcR4-yI",
  authDomain: "saman-car-spare-parts.firebaseapp.com",
  projectId: "saman-car-spare-parts",
  storageBucket: "saman-car-spare-parts.firebasestorage.app",
  messagingSenderId: "968293545131",
  appId: "1:968293545131:web:bdf98a89bce9ada29ab3ee",
  measurementId: "G-9XJQN7F7G8"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);