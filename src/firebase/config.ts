
'use client';

/**
 * Konfigurasi Firebase resmi Nexvora Studio.
 * Diperbarui sesuai permintaan untuk menghilangkan error auth/api-key-not-valid.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyDRg1vUAI6p7r1bpmsXa7NIW0Do12Q8j28",
  authDomain: "studio-2270113515-d6b7c.firebaseapp.com",
  projectId: "studio-2270113515-d6b7c",
  storageBucket: "studio-2270113515-d6b7c.firebasestorage.app",
  messagingSenderId: "746532588854",
  appId: "1:746532588854:web:8da7fee7b9b88a00c6b797",
};

/**
 * Validasi apakah konfigurasi sudah terisi dengan benar.
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_API_KEY" &&
  firebaseConfig.apiKey.length > 10
);
