import { initializeApp, getApp, getApps } from 'firebase/app';

const firebaseConfig = {
  "projectId": "attendance-hero-av2o3",
  "appId": "1:351962014198:web:de46856783bc89291c67d7",
  "storageBucket": "attendance-hero-av2o3.firebasestorage.app",
  "apiKey": "AIzaSyD9DrrKNZ9Egms20S3Di0bSVLZbNWAf5A0",
  "authDomain": "attendance-hero-av2o3.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "351962014198"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
