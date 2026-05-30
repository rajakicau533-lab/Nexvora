
'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig, isFirebaseConfigured } from './config';

let firebaseApp: any = null;
let firestore: Firestore | null = null;
let auth: Auth | null = null;

export function initializeFirebase() {
  if (!isFirebaseConfigured) {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  try {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    firestore = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }

  return { firebaseApp, firestore, auth };
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
