import type { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  VALIDATION_LIMITS,
  type MonthlyBudget,
  type Transaction,
  type TransactionInput,
  type UserProfile,
} from '../types/finance';

function assertValidTransactionInput(input: TransactionInput): {
  title: string;
  note: string;
  amount: number;
  category: string;
  date: string;
  monthKey: string;
} {
  const title = input.title.trim().slice(0, VALIDATION_LIMITS.TITLE_MAX);
  const note = input.note.trim().slice(0, VALIDATION_LIMITS.NOTE_MAX);
  const category = input.category.trim().slice(0, VALIDATION_LIMITS.CATEGORY_MAX);
  const amount = Math.round(Number(input.amount) * 100) / 100;
  const date = input.date.trim();
  const monthKey = date.slice(0, 7);

  if (title.length < VALIDATION_LIMITS.TITLE_MIN) {
    throw new Error('กรุณาระบุชื่อรายการ');
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > VALIDATION_LIMITS.MAX_AMOUNT) {
    throw new Error('จำนวนเงินต้องมากกว่า 0 และไม่เกิน 1,000,000,000 บาท');
  }
  if (!VALIDATION_LIMITS.CATEGORY_PATTERN.test(category)) {
    throw new Error('รหัสหมวดหมู่ไม่ถูกต้อง');
  }
  if (!VALIDATION_LIMITS.DATE_PATTERN.test(date) || !VALIDATION_LIMITS.MONTH_PATTERN.test(monthKey)) {
    throw new Error('รูปแบบวันที่ไม่ถูกต้อง');
  }

  return { title, note, amount, category, date, monthKey };
}

export async function ensureUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  const displayName = (user.displayName?.trim() || user.email?.split('@')[0] || 'ผู้ใช้งาน').slice(0, 120);
  const email = (user.email || '').slice(0, 254);
  const photoURL = (user.photoURL || '').slice(0, 500);

  let snap;
  try {
    snap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (!snap.exists()) {
    try {
      await setDoc(userRef, {
        uid: user.uid,
        email,
        displayName,
        photoURL,
        defaultMonthlyBudget: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    try {
      await updateDoc(userRef, {
        email,
        displayName,
        photoURL,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}

export function subscribeToUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  return onSnapshot(
    userRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      onData(snapshot.data() as UserProfile);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function updateDefaultMonthlyBudget(uid: string, limitAmount: number): Promise<void> {
  const cleanAmount = Math.round(Number(limitAmount) * 100) / 100;
  if (!Number.isFinite(cleanAmount) || cleanAmount < 0 || cleanAmount > VALIDATION_LIMITS.MAX_AMOUNT) {
    throw new Error('งบประมาณต้องอยู่ระหว่าง 0 ถึง 1,000,000,000 บาท');
  }
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      defaultMonthlyBudget: cleanAmount,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToTransactions(
  uid: string,
  onData: (transactions: Transaction[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = `users/${uid}/transactions`;
  const q = query(collection(db, 'users', uid, 'transactions'), where('userId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Transaction[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: String(data.userId ?? uid),
          type: data.type === 'income' ? 'income' : 'expense',
          amount: Number(data.amount ?? 0),
          category: String(data.category ?? 'other_expense'),
          title: String(data.title ?? ''),
          note: String(data.note ?? ''),
          date: String(data.date ?? ''),
          monthKey: String(data.monthKey ?? ''),
          paymentMethod: data.paymentMethod ?? 'other',
          createdAt: data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null,
        };
      });

      items.sort((a, b) => {
        if (b.date !== a.date) {
          return b.date.localeCompare(a.date);
        }
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });

      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function createTransaction(uid: string, input: TransactionInput): Promise<string> {
  const validated = assertValidTransactionInput(input);
  const path = `users/${uid}/transactions`;
  try {
    const docRef = await addDoc(collection(db, 'users', uid, 'transactions'), {
      userId: uid,
      type: input.type,
      amount: validated.amount,
      category: validated.category,
      title: validated.title,
      note: validated.note,
      date: validated.date,
      monthKey: validated.monthKey,
      paymentMethod: input.paymentMethod,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTransaction(
  uid: string,
  transactionId: string,
  input: TransactionInput
): Promise<void> {
  const validated = assertValidTransactionInput(input);
  const path = `users/${uid}/transactions/${transactionId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'transactions', transactionId), {
      type: input.type,
      amount: validated.amount,
      category: validated.category,
      title: validated.title,
      note: validated.note,
      date: validated.date,
      monthKey: validated.monthKey,
      paymentMethod: input.paymentMethod,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTransaction(uid: string, transactionId: string): Promise<void> {
  const path = `users/${uid}/transactions/${transactionId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'transactions', transactionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToBudgets(
  uid: string,
  onData: (budgets: MonthlyBudget[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = `users/${uid}/budgets`;
  const q = query(collection(db, 'users', uid, 'budgets'), where('userId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: MonthlyBudget[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: String(data.userId ?? uid),
          monthKey: String(data.monthKey ?? docSnap.id),
          limitAmount: Number(data.limitAmount ?? 0),
          createdAt: data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null,
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function upsertMonthlyBudget(
  uid: string,
  monthKey: string,
  limitAmount: number
): Promise<void> {
  if (!VALIDATION_LIMITS.MONTH_PATTERN.test(monthKey)) {
    throw new Error('รูปแบบเดือนไม่ถูกต้อง');
  }
  const cleanAmount = Math.round(Number(limitAmount) * 100) / 100;
  if (!Number.isFinite(cleanAmount) || cleanAmount < 0 || cleanAmount > VALIDATION_LIMITS.MAX_AMOUNT) {
    throw new Error('งบประมาณต้องอยู่ระหว่าง 0 ถึง 1,000,000,000 บาท');
  }

  const path = `users/${uid}/budgets/${monthKey}`;
  const budgetRef = doc(db, 'users', uid, 'budgets', monthKey);

  let existingSnap;
  try {
    existingSnap = await getDoc(budgetRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (!existingSnap.exists()) {
    try {
      await setDoc(budgetRef, {
        userId: uid,
        monthKey,
        limitAmount: cleanAmount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    try {
      await updateDoc(budgetRef, {
        limitAmount: cleanAmount,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}
