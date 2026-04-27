import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth'
import { auth, googleProvider } from './firebase'

export async function signUpWithEmail({ username, email, password }) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(userCredential.user, { displayName: username })
  await sendEmailVerification(userCredential.user)
  return userCredential.user
}

export async function signInWithEmail({ email, password }) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export async function signInWithGoogle() {
  const userCredential = await signInWithPopup(auth, googleProvider)
  return userCredential.user
}

export async function logOut() {
  await signOut(auth)
}

export function getCurrentUser() {
  return auth.currentUser
}