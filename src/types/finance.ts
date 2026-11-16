import type { Timestamp } from 'firebase/firestore';

export type TransactionType = 'income' | 'expense';

export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'promptpay'
  | 'credit_card'
  | 'e_wallet'
  | 'other';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  defaultMonthlyBudget: number;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  title: string;
  note: string;
  date: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM
  paymentMethod: PaymentMethod;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  category: string;
  title: string;
  note: string;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
}

export interface MonthlyBudget {
  id: string; // YYYY-MM
  userId: string;
  monthKey: string;
  limitAmount: number;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface CategoryMeta {
  id: string;
  label: string;
  type: TransactionType;
  color: string;
}

export interface PaymentMethodMeta {
  id: PaymentMethod;
  label: string;
}

// Validation bounds synchronized verbatim with firebase-blueprint.json & firestore.rules
export const VALIDATION_LIMITS = {
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  CATEGORY_PATTERN: /^[a-zA-Z0-9_-]+$/,
  DATE_PATTERN: /^\d{4}-\d{2}-\d{2}$/,
  MONTH_PATTERN: /^\d{4}-\d{2}$/,
  TITLE_MIN: 1,
  TITLE_MAX: 120,
  NOTE_MAX: 500,
  CATEGORY_MAX: 60,
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 1_000_000_000,
} as const;

export const INCOME_CATEGORIES: CategoryMeta[] = [
  { id: 'salary', label: 'เงินเดือน / ค่าจ้าง', type: 'income', color: '#0F766E' },
  { id: 'freelance', label: 'รายได้เสริม / ฟรีแลนซ์', type: 'income', color: '#0D9488' },
  { id: 'business', label: 'ขายสินค้า / ธุรกิจ', type: 'income', color: '#0284C7' },
  { id: 'investment', label: 'ปันผล / ดอกเบี้ย / ลงทุน', type: 'income', color: '#16A34A' },
  { id: 'bonus', label: 'โบนัส / เงินรางวัล', type: 'income', color: '#65A30D' },
  { id: 'allowance', label: 'เงินสนับสนุน / ของขวัญ', type: 'income', color: '#0891B2' },
  { id: 'other_income', label: 'รายรับอื่นๆ', type: 'income', color: '#475569' },
];

export const EXPENSE_CATEGORIES: CategoryMeta[] = [
  { id: 'food', label: 'อาหารและเครื่องดื่ม', type: 'expense', color: '#DC2626' },
  { id: 'transport', label: 'เดินทาง / น้ำมัน', type: 'expense', color: '#EA580C' },
  { id: 'housing', label: 'ที่พัก / ค่าน้ำค่าไฟ', type: 'expense', color: '#D97706' },
  { id: 'shopping', label: 'ช้อปปิ้ง / ของใช้ส่วนตัว', type: 'expense', color: '#E11D48' },
  { id: 'health', label: 'สุขภาพ / การแพทย์', type: 'expense', color: '#9333EA' },
  { id: 'education', label: 'การศึกษา / หนังสือ', type: 'expense', color: '#2563EB' },
  { id: 'entertainment', label: 'บันเทิง / ท่องเที่ยว', type: 'expense', color: '#DB2777' },
  { id: 'subscription', label: 'บริการรายเดือน / อินเทอร์เน็ต', type: 'expense', color: '#4F46E5' },
  { id: 'savings_transfer', label: 'ออมเงิน / ลงทุน', type: 'expense', color: '#0F766E' },
  { id: 'other_expense', label: 'รายจ่ายอื่นๆ', type: 'expense', color: '#64748B' },
];

export const ALL_CATEGORIES: CategoryMeta[] = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export const PAYMENT_METHODS: PaymentMethodMeta[] = [
  { id: 'promptpay', label: 'พร้อมเพย์ (PromptPay)' },
  { id: 'bank_transfer', label: 'โอนผ่านธนาคาร' },
  { id: 'cash', label: 'เงินสด' },
  { id: 'credit_card', label: 'บัตรเครดิต / เดบิต' },
  { id: 'e_wallet', label: 'กระเป๋าเงินอิเล็กทรอนิกส์' },
  { id: 'other', label: 'ช่องทางอื่นๆ' },
];

export function getCategoryMeta(categoryId: string): CategoryMeta {
  return (
    ALL_CATEGORIES.find((c) => c.id === categoryId) ?? {
      id: categoryId,
      label: categoryId,
      type: 'expense',
      color: '#64748B',
    }
  );
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHODS.find((m) => m.id === method)?.label ?? 'ช่องทางอื่นๆ';
}
