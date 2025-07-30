// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  "projectId": "schedulezen-pmu5k",
  "appId": "1:300321211314:web:1b3de6d5f0fe625812daab",
  "storageBucket": "schedulezen-pmu5k.firebasestorage.app",
  "apiKey": "AIzaSyDpg6YUGzSHBK-1ZW8W6gQQ--XNcKnTuJ8",
  "authDomain": "schedulezen-pmu5k.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "300321211314"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
