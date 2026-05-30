'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig, isFirebaseConfigured } from './config';

let app: FirebaseApp | null = null;
let firestore: Firestore | null = null;
let auth: Auth | null = null;

/**
 * Initializes Firebase services safely. 
 * Returns null for services if configuration is missing to prevent runtime crashes.
 */
export function initializeFirebase() {
  if (!isFirebaseConfigured) {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    
    firestore = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    // Log error but don't crash the entire app tree
    console.error("Firebase initialization failed:", error);
    return { firebaseApp: null, firestore: null, auth: null };
  }

  return { firebaseApp: app, firestore, auth };
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
