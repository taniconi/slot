/**
 * Seed script for Firebase Firestore
 * Run with: node scripts/seed.js
 *
 * Seeds ONLY the access codes needed for login.
 * Words and quotes are NOT pre-created: the database contains
 * only items that users actually register.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';

// Try loading .env or .env.local
if (existsSync('.env.local')) {
  const envConfig = dotenv.parse(readFileSync('.env.local'));
  for (const k in envConfig) process.env[k] = envConfig[k];
} else if (existsSync('.env')) {
  const envConfig = dotenv.parse(readFileSync('.env'));
  for (const k in envConfig) process.env[k] = envConfig[k];
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.log('Firebase config not found in environment variables.');
  console.log('Please provide VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID in .env file.');
  process.exit(0);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ACCESS_CODES = ['konoyaro', 'monin', 'urusai'];

async function seed() {
  console.log('--- Initializing Firestore for KONOYARO SLOT ---');

  console.log('1. Setting up access codes...');
  for (const code of ACCESS_CODES) {
    await setDoc(doc(db, 'access_codes', code), {
      code,
      active: true,
      createdAt: serverTimestamp(),
    });
    console.log(`   - Access code added: ${code}`);
  }

  console.log('Words/quotes are not seeded: only user-registered items are stored.');
  console.log('Firestore seed completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error seeding Firestore:', err);
  process.exit(1);
});
