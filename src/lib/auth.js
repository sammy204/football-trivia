import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
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

export async function resetPassword({ email }) {
  await sendPasswordResetEmail(auth, email)
}

export async function signInWithGoogle() {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider)
    return userCredential.user
  } catch (e) {
    console.error('Google error code:', e.code)
    console.error('Google error message:', e.message)
    throw e
  }
}

export async function logOut() {
  await signOut(auth)
}

export function getCurrentUser() {
  return auth.currentUser
}