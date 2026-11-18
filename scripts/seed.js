/**
 * Seed script for Firebase Firestore
 * Run with: node scripts/seed.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
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
const SAMPLE_WORDS = ['バカ', 'アホ', 'ハゲ', '神', '天才', 'ゆちゆち'];
const SAMPLE_QUOTES = [
  '諦めたらそこで試合終了ですよ',
  '努力は必ず報われる',
  '事件は会議室で起きてるんじゃない',
];

async function seed() {
  console.log('--- Initializing Firestore for KONOYARO SLOT ---');

  // 1. access_codes
  console.log('1. Setting up access codes...');
  for (const code of ACCESS_CODES) {
    await setDoc(doc(db, 'access_codes', code), {
      code,
      active: true,
      createdAt: serverTimestamp(),
    });
    console.log(`   - Access code added: ${code}`);
  }

  // 2. konoyaro_words
  console.log('2. Setting up sample konoyaro words...');
  for (const word of SAMPLE_WORDS) {
    const q = query(collection(db, 'konoyaro_words'), where('word', '==', word));
    const snap = await getDocs(q);
    if (snap.empty) {
      await addDoc(collection(db, 'konoyaro_words'), {
        word,
        createdBy: 'system',
        createdAt: serverTimestamp(),
      });
      console.log(`   - Word added: ${word}`);
    } else {
      console.log(`   - Word already exists: ${word}`);
    }
  }

  // 3. quotes
  console.log('3. Setting up sample quotes...');
  for (const text of SAMPLE_QUOTES) {
    const q = query(collection(db, 'quotes'), where('text', '==', text));
    const snap = await getDocs(q);
    if (snap.empty) {
      await addDoc(collection(db, 'quotes'), {
        text,
        createdBy: 'system',
        createdAt: serverTimestamp(),
      });
      console.log(`   - Quote added: ${text}`);
    } else {
      console.log(`   - Quote already exists: ${text}`);
    }
  }

  console.log('Firestore seed completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error seeding Firestore:', err);
  process.exit(1);
});
