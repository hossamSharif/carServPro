// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBmcKzpRqYmLTGhAh9zYri4SYWerM3w4GQ",
  authDomain: "car-serv-pro.firebaseapp.com",
  projectId: "car-serv-pro",
  storageBucket: "car-serv-pro.firebasestorage.app",
  messagingSenderId: "358531689577",
  appId: "1:358531689577:web:d4ec00052df62d594046f8",
  measurementId: "G-VF30ZQJY84"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);