import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from './config';
import { User, KonoyaroWord, Quote, UserKonoyaro, TPHistory } from '../types';

// Valid access codes as required
const INITIAL_ACCESS_CODES = ['konoyaro', 'monin', 'urusai'];

// Local storage keys for mock mode fallback
const LS_USERS = 'konoyaro_mock_users';
const LS_WORDS = 'konoyaro_mock_words';
const LS_QUOTES = 'konoyaro_mock_quotes';
const LS_OWNED_KONOYAROS = 'konoyaro_mock_owned_konoyaros';
const LS_HISTORIES = 'konoyaro_mock_histories';
const LS_ACCESS_CODES = 'konoyaro_mock_access_codes';

// Initialize mock storage with initial sample data if empty
function initMockData() {
  if (!localStorage.getItem(LS_ACCESS_CODES)) {
    localStorage.setItem(LS_ACCESS_CODES, JSON.stringify(INITIAL_ACCESS_CODES));
  }
  if (!localStorage.getItem(LS_WORDS)) {
    localStorage.setItem(
      LS_WORDS,
      JSON.stringify([
        { word: 'バカ', createdBy: 'system', createdAt: Date.now() },
        { word: 'アホ', createdBy: 'system', createdAt: Date.now() },
        { word: 'ハゲ', createdBy: 'system', createdAt: Date.now() },
        { word: '神', createdBy: 'system', createdAt: Date.now() },
        { word: '天才', createdBy: 'system', createdAt: Date.now() },
        { word: 'ゆちゆち', createdBy: 'system', createdAt: Date.now() },
      ])
    );
  }
  if (!localStorage.getItem(LS_QUOTES)) {
    localStorage.setItem(
      LS_QUOTES,
      JSON.stringify([
        { text: '諦めたらそこで試合終了ですよ', createdBy: 'system', createdAt: Date.now() },
        { text: '努力は必ず報われる', createdBy: 'system', createdAt: Date.now() },
      ])
    );
  }
  if (!localStorage.getItem(LS_USERS)) {
    localStorage.setItem(LS_USERS, JSON.stringify({}));
  }
  if (!localStorage.getItem(LS_OWNED_KONOYAROS)) {
    localStorage.setItem(LS_OWNED_KONOYAROS, JSON.stringify([]));
  }
  if (!localStorage.getItem(LS_HISTORIES)) {
    localStorage.setItem(LS_HISTORIES, JSON.stringify([]));
  }
}

initMockData();

// 1. Access Code Verification
export async function validateAccessCode(code: string): Promise<boolean> {
  const normalizedCode = code.trim().toLowerCase();
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'access_codes', normalizedCode);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().active !== false) {
        return true;
      }
      // Also check query if stored as documents
      const q = query(collection(db, 'access_codes'), where('code', '==', normalizedCode));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        return true;
      }
      // Fallback check against valid access codes
      return INITIAL_ACCESS_CODES.includes(normalizedCode);
    } catch (e) {
      console.warn('Error checking Firestore access_codes, using fallback:', e);
      return INITIAL_ACCESS_CODES.includes(normalizedCode);
    }
  }

  // Mock mode
  const validCodes: string[] = JSON.parse(localStorage.getItem(LS_ACCESS_CODES) || '[]');
  return validCodes.includes(normalizedCode);
}

// 2. User Login / Registration
export async function loginOrRegisterUser(username: string): Promise<User> {
  const cleanUsername = username.trim();
  if (!/^[a-zA-Z0-9]{1,8}$/.test(cleanUsername)) {
    throw new Error('ユーザー名は半角英数字8文字以内で入力してください');
  }

  if (isFirebaseConfigured && db) {
    try {
      const userDocRef = doc(db, 'users', cleanUsername);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          username: cleanUsername,
          tp: data.tp ?? 0,
          createdAt: data.createdAt ?? new Date().toISOString(),
        };
      } else {
        const newUser: User = {
          username: cleanUsername,
          tp: 0,
          createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newUser);
        return {
          username: cleanUsername,
          tp: 0,
          createdAt: new Date().toISOString(),
        };
      }
    } catch (e) {
      console.warn('Error in Firestore user auth, falling back to mock:', e);
    }
  }

  // Mock mode
  const users = JSON.parse(localStorage.getItem(LS_USERS) || '{}');
  if (!users[cleanUsername]) {
    users[cleanUsername] = {
      username: cleanUsername,
      tp: 0,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(LS_USERS, JSON.stringify(users));
  }
  return users[cleanUsername];
}

// 3. Get User Data
export async function getUserData(username: string): Promise<User | null> {
  if (isFirebaseConfigured && db) {
    try {
      const userDocRef = doc(db, 'users', username);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          username,
          tp: data.tp ?? 0,
          createdAt: data.createdAt,
        };
      }
    } catch (e) {
      console.warn('Error fetching Firestore user:', e);
    }
  }

  // Mock mode
  const users = JSON.parse(localStorage.getItem(LS_USERS) || '{}');
  return users[username] || null;
}

// 4. Check if Konoyaro Word Exists
export async function checkWordExists(word: string): Promise<boolean> {
  const cleanWord = word.trim();
  if (!cleanWord) return false;

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'konoyaro_words'), where('word', '==', cleanWord));
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (e) {
      console.warn('Error checking konoyaro word existence:', e);
    }
  }

  // Mock mode
  const words: KonoyaroWord[] = JSON.parse(localStorage.getItem(LS_WORDS) || '[]');
  return words.some((w) => w.word === cleanWord);
}

// 5. Register Konoyaro Word (+10TP)
export async function registerKonoyaroWord(username: string, word: string): Promise<number> {
  const cleanWord = word.trim();
  if (!cleanWord || cleanWord.length > 10) {
    throw new Error('単語は1文字以上10文字以内で入力してください');
  }

  const exists = await checkWordExists(cleanWord);
  if (exists) {
    throw new Error('この単語は既に登録されています');
  }

  if (isFirebaseConfigured && db) {
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', username);
        const userDoc = await transaction.get(userRef);
        const currentTp = userDoc.exists() ? userDoc.data().tp || 0 : 0;
        const newTp = currentTp + 10;

        transaction.update(userRef, { tp: newTp });

        // Add word
        const wordRef = doc(collection(db, 'konoyaro_words'));
        transaction.set(wordRef, {
          word: cleanWord,
          createdBy: username,
          createdAt: serverTimestamp(),
        });

        // Add TP history
        const historyRef = doc(collection(db, 'tp_histories'));
        transaction.set(historyRef, {
          username,
          title: 'コノヤロー登録',
          amount: 10,
          createdAt: serverTimestamp(),
        });
      });
      return 10;
    } catch (e) {
      console.warn('Error in Firestore registerKonoyaroWord:', e);
    }
  }

  // Mock mode
  const words: KonoyaroWord[] = JSON.parse(localStorage.getItem(LS_WORDS) || '[]');
  words.push({ word: cleanWord, createdBy: username, createdAt: Date.now() });
  localStorage.setItem(LS_WORDS, JSON.stringify(words));

  const users = JSON.parse(localStorage.getItem(LS_USERS) || '{}');
  if (users[username]) {
    users[username].tp = (users[username].tp || 0) + 10;
    localStorage.setItem(LS_USERS, JSON.stringify(users));
  }

  const histories: TPHistory[] = JSON.parse(localStorage.getItem(LS_HISTORIES) || '[]');
  histories.unshift({
    username,
    title: 'コノヤロー登録',
    amount: 10,
    createdAt: Date.now(),
  });
  localStorage.setItem(LS_HISTORIES, JSON.stringify(histories));

  return 10;
}

// 6. Check Quote Exists
export async function checkQuoteExists(text: string): Promise<boolean> {
  const cleanText = text.trim();
  if (!cleanText) return false;

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'quotes'), where('text', '==', cleanText));
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (e) {
      console.warn('Error checking quote existence:', e);
    }
  }

  // Mock mode
  const quotes: Quote[] = JSON.parse(localStorage.getItem(LS_QUOTES) || '[]');
  return quotes.some((q) => q.text === cleanText);
}

// 7. Register Quote (+10TP)
export async function registerQuote(username: string, text: string): Promise<number> {
  const cleanText = text.trim();
  if (!cleanText || cleanText.length > 20) {
    throw new Error('語録・名言は1文字以上20文字以内で入力してください');
  }

  const exists = await checkQuoteExists(cleanText);
  if (exists) {
    throw new Error('この名言・語録は既に登録されています');
  }

  if (isFirebaseConfigured && db) {
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', username);
        const userDoc = await transaction.get(userRef);
        const currentTp = userDoc.exists() ? userDoc.data().tp || 0 : 0;
        const newTp = currentTp + 10;

        transaction.update(userRef, { tp: newTp });

        const quoteRef = doc(collection(db, 'quotes'));
        transaction.set(quoteRef, {
          text: cleanText,
          createdBy: username,
          createdAt: serverTimestamp(),
        });

        const historyRef = doc(collection(db, 'tp_histories'));
        transaction.set(historyRef, {
          username,
          title: '語録登録',
          amount: 10,
          createdAt: serverTimestamp(),
        });
      });
      return 10;
    } catch (e) {
      console.warn('Error in Firestore registerQuote:', e);
    }
  }

  // Mock mode
  const quotes: Quote[] = JSON.parse(localStorage.getItem(LS_QUOTES) || '[]');
  quotes.push({ text: cleanText, createdBy: username, createdAt: Date.now() });
  localStorage.setItem(LS_QUOTES, JSON.stringify(quotes));

  const users = JSON.parse(localStorage.getItem(LS_USERS) || '{}');
  if (users[username]) {
    users[username].tp = (users[username].tp || 0) + 10;
    localStorage.setItem(LS_USERS, JSON.stringify(users));
  }

  const histories: TPHistory[] = JSON.parse(localStorage.getItem(LS_HISTORIES) || '[]');
  histories.unshift({
    username,
    title: '語録登録',
    amount: 10,
    createdAt: Date.now(),
  });
  localStorage.setItem(LS_HISTORIES, JSON.stringify(histories));

  return 10;
}

// 8. Fetch All Konoyaro Words
export async function getAllKonoyaroWords(): Promise<string[]> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'konoyaro_words'));
      const list = snap.docs.map((d) => d.data().word).filter(Boolean);
      if (list.length > 0) return list;
    } catch (e) {
      console.warn('Error getting words from Firestore:', e);
    }
  }

  // Mock fallback
  const words: KonoyaroWord[] = JSON.parse(localStorage.getItem(LS_WORDS) || '[]');
  return words.map((w) => w.word);
}

// 9. Play Konoyaro Generator (-1TP, save to owned_konoyaros)
export async function saveGeneratedKonoyaro(username: string, word: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', username);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error('ユーザーが見つかりません');
        const currentTp = userDoc.data().tp || 0;
        if (currentTp < 1) throw new Error('TPが足りません (1TP必要)');

        transaction.update(userRef, { tp: currentTp - 1 });

        // Save owned konoyaro
        const ownedRef = doc(collection(db, 'user_konoyaros'));
        transaction.set(ownedRef, {
          username,
          word,
          createdAt: serverTimestamp(),
        });

        // Add history
        const historyRef = doc(collection(db, 'tp_histories'));
        transaction.set(historyRef, {
          username,
          title: 'コノヤロー自動生成',
          amount: -1,
          createdAt: serverTimestamp(),
        });
      });
      return;
    } catch (e) {
      console.warn('Error in saveGeneratedKonoyaro Firestore:', e);
    }
  }

  // Mock mode
  const users = JSON.parse(localStorage.getItem(LS_USERS) || '{}');
  if (!users[username] || users[username].tp < 1) {
    throw new Error('TPが足りません (1TP必要)');
  }
  users[username].tp -= 1;
  localStorage.setItem(LS_USERS, JSON.stringify(users));

  const owned: UserKonoyaro[] = JSON.parse(localStorage.getItem(LS_OWNED_KONOYAROS) || '[]');
  owned.unshift({
    username,
    word,
    createdAt: Date.now(),
  });
  localStorage.setItem(LS_OWNED_KONOYAROS, JSON.stringify(owned));

  const histories: TPHistory[] = JSON.parse(localStorage.getItem(LS_HISTORIES) || '[]');
  histories.unshift({
    username,
    title: 'コノヤロー自動生成',
    amount: -1,
    createdAt: Date.now(),
  });
  localStorage.setItem(LS_HISTORIES, JSON.stringify(histories));
}

// 10. Play Yuchi Maker (-10TP, head00 = +100TP)
export async function playYuchiMaker(username: string, headIndex: number): Promise<{ isJackpot: boolean; gainedTp: number; netChange: number }> {
  const isJackpot = headIndex === 0;
  const gainedTp = isJackpot ? 100 : 0;
  const netChange = gainedTp - 10;

  if (isFirebaseConfigured && db) {
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', username);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error('ユーザーが見つかりません');
        const currentTp = userDoc.data().tp || 0;
        if (currentTp < 10) throw new Error('TPが足りません (10TP必要)');

        // First deduct 10
        let newTp = currentTp - 10;
        const historySpendRef = doc(collection(db, 'tp_histories'));
        transaction.set(historySpendRef, {
          username,
          title: 'ゆちゆちメーカー',
          amount: -10,
          createdAt: serverTimestamp(),
        });

        if (isJackpot) {
          newTp += 100;
          const historyWinRef = doc(collection(db, 'tp_histories'));
          transaction.set(historyWinRef, {
            username,
            title: 'ゆちゆちメーカー 大当たり',
            amount: 100,
            createdAt: serverTimestamp(),
          });
        }

        transaction.update(userRef, { tp: newTp });
      });
      return { isJackpot, gainedTp, netChange };
    } catch (e) {
      console.warn('Error in playYuchiMaker Firestore:', e);
    }
  }

  // Mock mode
  const users = JSON.parse(localStorage.getItem(LS_USERS) || '{}');
  if (!users[username] || users[username].tp < 10) {
    throw new Error('TPが足りません (10TP必要)');
  }
  users[username].tp -= 10;

  const histories: TPHistory[] = JSON.parse(localStorage.getItem(LS_HISTORIES) || '[]');
  histories.unshift({
    username,
    title: 'ゆちゆちメーカー',
    amount: -10,
    createdAt: Date.now(),
  });

  if (isJackpot) {
    users[username].tp += 100;
    histories.unshift({
      username,
      title: 'ゆちゆちメーカー 大当たり',
      amount: 100,
      createdAt: Date.now(),
    });
  }

  localStorage.setItem(LS_USERS, JSON.stringify(users));
  localStorage.setItem(LS_HISTORIES, JSON.stringify(histories));

  return { isJackpot, gainedTp, netChange };
}

// 11. Play Face Slot (-10TP; 3-match = +100TP, 2-match = +10TP, 0-match = 0TP)
export async function playFaceSlot(
  username: string,
  reels: [number, number, number]
): Promise<{ matchCount: number; gainedTp: number; netChange: number }> {
  let matchCount = 0;
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    matchCount = 3;
  } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
    matchCount = 2;
  } else {
    matchCount = 0;
  }

  const gainedTp = matchCount === 3 ? 100 : matchCount === 2 ? 10 : 0;
  const netChange = gainedTp - 10;

  if (isFirebaseConfigured && db) {
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', username);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error('ユーザーが見つかりません');
        const currentTp = userDoc.data().tp || 0;
        if (currentTp < 10) throw new Error('TPが足りません (10TP必要)');

        let newTp = currentTp - 10;
        const historySpendRef = doc(collection(db, 'tp_histories'));
        transaction.set(historySpendRef, {
          username,
          title: 'みんなの顔面スロット',
          amount: -10,
          createdAt: serverTimestamp(),
        });

        if (gainedTp > 0) {
          newTp += gainedTp;
          const historyWinRef = doc(collection(db, 'tp_histories'));
          transaction.set(historyWinRef, {
            username,
            title: matchCount === 3 ? 'みんなの顔面スロット 3つ揃い' : 'みんなの顔面スロット 2つ揃い',
            amount: gainedTp,
            createdAt: serverTimestamp(),
          });
        }

        transaction.update(userRef, { tp: newTp });
      });
      return { matchCount, gainedTp, netChange };
    } catch (e) {
      console.warn('Error in playFaceSlot Firestore:', e);
    }
  }

  // Mock mode
  const users = JSON.parse(localStorage.getItem(LS_USERS) || '{}');
  if (!users[username] || users[username].tp < 10) {
    throw new Error('TPが足りません (10TP必要)');
  }
  users[username].tp -= 10;

  const histories: TPHistory[] = JSON.parse(localStorage.getItem(LS_HISTORIES) || '[]');
  histories.unshift({
    username,
    title: 'みんなの顔面スロット',
    amount: -10,
    createdAt: Date.now(),
  });

  if (gainedTp > 0) {
    users[username].tp += gainedTp;
    histories.unshift({
      username,
      title: matchCount === 3 ? 'みんなの顔面スロット 3つ揃い' : 'みんなの顔面スロット 2つ揃い',
      amount: gainedTp,
      createdAt: Date.now(),
    });
  }

  localStorage.setItem(LS_USERS, JSON.stringify(users));
  localStorage.setItem(LS_HISTORIES, JSON.stringify(histories));

  return { matchCount, gainedTp, netChange };
}

// 12. Send TP (Firestore Transaction)
export async function sendTP(fromUsername: string, toUsername: string, amount: number): Promise<void> {
  const cleanToUsername = toUsername.trim();
  if (fromUsername === cleanToUsername) {
    throw new Error('自分自身には送金できません');
  }
  if (!amount || isNaN(amount) || amount <= 0) {
    throw new Error('送金する数量を正しく入力してください');
  }

  if (isFirebaseConfigured && db) {
    try {
      await runTransaction(db, async (transaction) => {
        const senderRef = doc(db, 'users', fromUsername);
        const receiverRef = doc(db, 'users', cleanToUsername);

        const senderDoc = await transaction.get(senderRef);
        const receiverDoc = await transaction.get(receiverRef);

        if (!senderDoc.exists()) throw new Error('送信元ユーザーが見つかりません');
        if (!receiverDoc.exists()) throw new Error('うけとる人のIDが存在しません');

        const senderTp = senderDoc.data().tp || 0;
        if (senderTp < amount) {
          throw new Error(`TPが足りません (所持: ${senderTp}TP, 送金希望: ${amount}TP)`);
        }

        const receiverTp = receiverDoc.data().tp || 0;

        // Update sender & receiver
        transaction.update(senderRef, { tp: senderTp - amount });
        transaction.update(receiverRef, { tp: receiverTp + amount });

        // Record history for sender
        const senderHistRef = doc(collection(db, 'tp_histories'));
        transaction.set(senderHistRef, {
          username: fromUsername,
          title: `送金 (@${cleanToUsername}へ)`,
          amount: -amount,
          createdAt: serverTimestamp(),
        });

        // Record history for receiver
        const receiverHistRef = doc(collection(db, 'tp_histories'));
        transaction.set(receiverHistRef, {
          username: cleanToUsername,
          title: `送金受取 (@${fromUsername}から)`,
          amount: amount,
          createdAt: serverTimestamp(),
        });
      });
      return;
    } catch (e: any) {
      console.warn('Error in sendTP transaction:', e);
      throw e;
    }
  }

  // Mock mode
  const users = JSON.parse(localStorage.getItem(LS_USERS) || '{}');
  if (!users[cleanToUsername]) {
    throw new Error('うけとる人のIDが存在しません');
  }
  if (!users[fromUsername] || users[fromUsername].tp < amount) {
    const cur = users[fromUsername]?.tp || 0;
    throw new Error(`TPが足りません (所持: ${cur}TP, 送金希望: ${amount}TP)`);
  }

  users[fromUsername].tp -= amount;
  users[cleanToUsername].tp += amount;
  localStorage.setItem(LS_USERS, JSON.stringify(users));

  const histories: TPHistory[] = JSON.parse(localStorage.getItem(LS_HISTORIES) || '[]');
  histories.unshift({
    username: fromUsername,
    title: `送金 (@${cleanToUsername}へ)`,
    amount: -amount,
    createdAt: Date.now(),
  });
  histories.unshift({
    username: cleanToUsername,
    title: `送金受取 (@${fromUsername}から)`,
    amount: amount,
    createdAt: Date.now(),
  });
  localStorage.setItem(LS_HISTORIES, JSON.stringify(histories));
}

// 13. Get TP Histories for User
export async function getUserHistory(username: string): Promise<TPHistory[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'tp_histories'),
        where('username', '==', username),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as TPHistory),
      }));
    } catch (e) {
      // Fallback query without orderBy if index is building
      try {
        const q2 = query(collection(db, 'tp_histories'), where('username', '==', username));
        const snap2 = await getDocs(q2);
        const list = snap2.docs.map((d) => ({ id: d.id, ...(d.data() as TPHistory) }));
        return list.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
          return tB - tA;
        });
      } catch (e2) {
        console.warn('Error fetching histories from Firestore:', e2);
      }
    }
  }

  // Mock mode
  const histories: TPHistory[] = JSON.parse(localStorage.getItem(LS_HISTORIES) || '[]');
  return histories.filter((h) => h.username === username);
}

// 14. Get User Owned Konoyaros
export async function getUserOwnedKonoyaros(username: string): Promise<UserKonoyaro[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'user_konoyaros'), where('username', '==', username));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as UserKonoyaro) }));
      return list.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
        return tB - tA;
      });
    } catch (e) {
      console.warn('Error fetching owned konoyaros:', e);
    }
  }

  // Mock mode
  const owned: UserKonoyaro[] = JSON.parse(localStorage.getItem(LS_OWNED_KONOYAROS) || '[]');
  return owned.filter((item) => item.username === username);
}

// 15. Asset URLs resolver (Firebase Storage with Local fallback)
export async function resolveYuchiAssets(): Promise<{
  heads: string[];
  body: string;
  leg: string;
}> {
  const localBase = import.meta.env.BASE_URL || './';
  const cleanBase = localBase.endsWith('/') ? localBase : `${localBase}/`;

  const fallback = {
    heads: [
      `${cleanBase}assets/yuchi/head00.webp`,
      `${cleanBase}assets/yuchi/head01.png`,
      `${cleanBase}assets/yuchi/head02.png`,
      `${cleanBase}assets/yuchi/head03.png`,
      `${cleanBase}assets/yuchi/head04.png`,
      `${cleanBase}assets/yuchi/head05.png`,
      `${cleanBase}assets/yuchi/head06.png`,
    ],
    body: `${cleanBase}assets/yuchi/body.webp`,
    leg: `${cleanBase}assets/yuchi/leg.webp`,
  };

  if (!isFirebaseConfigured || !storage) {
    return fallback;
  }

  try {
    const headPromises = [
      getDownloadURL(ref(storage, 'yuchi/head00.webp')).catch(() => fallback.heads[0]),
      getDownloadURL(ref(storage, 'yuchi/head01.png')).catch(() => fallback.heads[1]),
      getDownloadURL(ref(storage, 'yuchi/head02.png')).catch(() => fallback.heads[2]),
      getDownloadURL(ref(storage, 'yuchi/head03.png')).catch(() => fallback.heads[3]),
      getDownloadURL(ref(storage, 'yuchi/head04.png')).catch(() => fallback.heads[4]),
      getDownloadURL(ref(storage, 'yuchi/head05.png')).catch(() => fallback.heads[5]),
      getDownloadURL(ref(storage, 'yuchi/head06.png')).catch(() => fallback.heads[6]),
    ];
    const bodyPromise = getDownloadURL(ref(storage, 'yuchi/body.webp')).catch(() => fallback.body);
    const legPromise = getDownloadURL(ref(storage, 'yuchi/leg.webp')).catch(() => fallback.leg);

    const [heads, body, leg] = await Promise.all([
      Promise.all(headPromises),
      bodyPromise,
      legPromise,
    ]);

    return { heads, body, leg };
  } catch {
    return fallback;
  }
}

export async function resolveFaceAssets(): Promise<string[]> {
  const localBase = import.meta.env.BASE_URL || './';
  const cleanBase = localBase.endsWith('/') ? localBase : `${localBase}/`;

  const fallback = [
    `${cleanBase}assets/faces/00.png`,
    `${cleanBase}assets/faces/01.png`,
    `${cleanBase}assets/faces/02.png`,
    `${cleanBase}assets/faces/03.png`,
    `${cleanBase}assets/faces/04.png`,
    `${cleanBase}assets/faces/05.png`,
    `${cleanBase}assets/faces/06.png`,
  ];

  if (!isFirebaseConfigured || !storage) {
    return fallback;
  }

  try {
    const facePromises = fallback.map((fbUrl, i) => {
      const pad = i.toString().padStart(2, '0');
      return getDownloadURL(ref(storage, `faces/${pad}.png`)).catch(() => fbUrl);
    });
    return await Promise.all(facePromises);
  } catch {
    return fallback;
  }
}

// 16. Database Seed helper for Firestore
export async function seedFirestoreDatabase(): Promise<{ success: boolean; message: string }> {
  if (!isFirebaseConfigured || !db) {
    return {
      success: false,
      message: 'Firebase is not configured. Please check your .env settings.',
    };
  }

  try {
    // 1. Seed access codes
    for (const code of INITIAL_ACCESS_CODES) {
      await setDoc(doc(db, 'access_codes', code), {
        code,
        active: true,
        createdAt: serverTimestamp(),
      });
    }

    // 2. Seed initial words
    const sampleWords = ['バカ', 'アホ', 'ハゲ', '神', '天才', 'ゆちゆち'];
    for (const word of sampleWords) {
      const q = query(collection(db, 'konoyaro_words'), where('word', '==', word));
      const snap = await getDocs(q);
      if (snap.empty) {
        await addDoc(collection(db, 'konoyaro_words'), {
          word,
          createdBy: 'system',
          createdAt: serverTimestamp(),
        });
      }
    }

    // 3. Seed initial quotes
    const sampleQuotes = [
      '諦めたらそこで試合終了ですよ',
      '努力は必ず報われる',
      '事件は会議室で起きてるんじゃない',
    ];
    for (const text of sampleQuotes) {
      const q = query(collection(db, 'quotes'), where('text', '==', text));
      const snap = await getDocs(q);
      if (snap.empty) {
        await addDoc(collection(db, 'quotes'), {
          text,
          createdBy: 'system',
          createdAt: serverTimestamp(),
        });
      }
    }

    return {
      success: true,
      message: 'Firestore initialized with access codes and sample words/quotes!',
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to seed Firestore: ${error.message}`,
    };
  }
}
