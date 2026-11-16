import { X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { getTodayDateString } from '../lib/format';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  VALIDATION_LIMITS,
  type PaymentMethod,
  type Transaction,
  type TransactionInput,
  type TransactionType,
} from '../types/finance';

interface TransactionModalProps {
  open: boolean;
  editingTransaction: Transaction | null;
  defaultMonthKey: string;
  onClose: () => void;
  onSubmit: (input: TransactionInput, editingId?: string) => Promise<void>;
}

export function TransactionModal({
  open,
  editingTransaction,
  defaultMonthKey,
  onClose,
  onSubmit,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].id);
  const [date, setDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('promptpay');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmountStr(String(editingTransaction.amount));
      setTitle(editingTransaction.title);
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setPaymentMethod(editingTransaction.paymentMethod);
      setNote(editingTransaction.note);
    } else {
      const today = getTodayDateString();
      const initialDate = today.startsWith(defaultMonthKey) ? today : `${defaultMonthKey}-01`;
      setType('expense');
      setAmountStr('');
      setTitle('');
      setCategory(EXPENSE_CATEGORIES[0].id);
      setDate(initialDate);
      setPaymentMethod('promptpay');
      setNote('');
    }
  }, [open, editingTransaction, defaultMonthKey]);

  if (!open) return null;

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    const list = nextType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!list.some((c) => c.id === category)) {
      setCategory(list[0].id);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amountStr);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('กรุณากรอกจำนวนเงินที่มากกว่า 0 บาท');
      return;
    }
    if (parsedAmount > VALIDATION_LIMITS.MAX_AMOUNT) {
      setError('จำนวนเงินต้องไม่เกิน 1,000,000,000 บาท');
      return;
    }
    if (!title.trim()) {
      setError('กรุณาระบุชื่อรายการ');
      return;
    }
    if (!VALIDATION_LIMITS.DATE_PATTERN.test(date)) {
      setError('กรุณาเลือกวันที่ให้ถูกต้อง');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(
        {
          type,
          amount: Math.round(parsedAmount * 100) / 100,
          category,
          title: title.trim().slice(0, VALIDATION_LIMITS.TITLE_MAX),
          note: note.trim().slice(0, VALIDATION_LIMITS.NOTE_MAX),
          date,
          paymentMethod,
        },
        editingTransaction?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถบันทึกรายการได้');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="tx-modal-title" className="font-display text-base font-semibold text-slate-900">
            {editingTransaction ? 'แก้ไขรายการ' : 'บันทึกรายการใหม่'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Type Switch */}
          <div>
            <span className="mb-1.5 block text-xs font-medium text-slate-700">ประเภทรายการ</span>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`cursor-pointer rounded-md py-2 text-xs font-semibold transition-colors ${
                  type === 'expense'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รายจ่าย (Expense)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`cursor-pointer rounded-md py-2 text-xs font-semibold transition-colors ${
                  type === 'income'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รายรับ (Income)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Amount */}
            <div>
              <label htmlFor="tx-amount" className="mb-1.5 block text-xs font-medium text-slate-700">
                จำนวนเงิน (บาท)
              </label>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={VALIDATION_LIMITS.MAX_AMOUNT}
                required
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
              />
            </div>

            {/* Date */}
            <div>
              <label htmlFor="tx-date" className="mb-1.5 block text-xs font-medium text-slate-700">
                วันที่ทำรายการ
              </label>
              <input
                id="tx-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="tx-title" className="mb-1.5 block text-xs font-medium text-slate-700">
              ชื่อรายการ
            </label>
            <input
              id="tx-title"
              type="text"
              required
              maxLength={VALIDATION_LIMITS.TITLE_MAX}
              placeholder={type === 'expense' ? 'เช่น ค่าอาหารกลางวัน, ค่าไฟฟ้า' : 'เช่น เงินเดือน, ค่าออกแบบเว็บไซต์'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Category */}
            <div>
              <label htmlFor="tx-category" className="mb-1.5 block text-xs font-medium text-slate-700">
                หมวดหมู่
              </label>
              <select
                id="tx-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label htmlFor="tx-method" className="mb-1.5 block text-xs font-medium text-slate-700">
                ช่องทางชำระเงิน
              </label>
              <select
                id="tx-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label htmlFor="tx-note" className="mb-1.5 block text-xs font-medium text-slate-700">
              หมายเหตุเพิ่มเติม (ไม่บังคับ)
            </label>
            <textarea
              id="tx-note"
              rows={2}
              maxLength={VALIDATION_LIMITS.NOTE_MAX}
              placeholder="รายละเอียดเพิ่มเติม..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-lg bg-teal-700 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'กำลังบันทึก...' : editingTransaction ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
