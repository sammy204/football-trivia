import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyAD3nT2CMTVY6ztvkz7y_Q-NVQZ0PJbV8g",
  authDomain: "sports-trivia-85170.firebaseapp.com",
  databaseURL: "https://sports-trivia-85170-default-rtdb.firebaseio.com",
  projectId: "sports-trivia-85170",
  storageBucket: "sports-trivia-85170.firebasestorage.app",
  messagingSenderId: "706630062289",
  appId: "1:706630062289:web:1fc4cd2bdfe749a06e75f0"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()