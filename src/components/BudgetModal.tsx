import { X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { formatMonthLabel } from '../lib/format';
import { VALIDATION_LIMITS } from '../types/finance';

interface BudgetModalProps {
  open: boolean;
  monthKey: string;
  currentMonthLimit: number;
  defaultMonthlyBudget: number;
  onClose: () => void;
  onSaveMonthBudget: (monthKey: string, amount: number) => Promise<void>;
  onSaveDefaultBudget: (amount: number) => Promise<void>;
}

export function BudgetModal({
  open,
  monthKey,
  currentMonthLimit,
  defaultMonthlyBudget,
  onClose,
  onSaveMonthBudget,
  onSaveDefaultBudget,
}: BudgetModalProps) {
  const [scope, setScope] = useState<'month' | 'default'>('month');
  const [amountStr, setAmountStr] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setScope('month');
    setAmountStr(currentMonthLimit > 0 ? String(currentMonthLimit) : '');
  }, [open, currentMonthLimit, monthKey]);

  if (!open) return null;

  const handleScopeChange = (nextScope: 'month' | 'default') => {
    setScope(nextScope);
    if (nextScope === 'month') {
      setAmountStr(currentMonthLimit > 0 ? String(currentMonthLimit) : '');
    } else {
      setAmountStr(defaultMonthlyBudget > 0 ? String(defaultMonthlyBudget) : '');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = amountStr.trim() === '' ? 0 : Number(amountStr);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > VALIDATION_LIMITS.MAX_AMOUNT) {
      setError('กรุณากรอกงบประมาณระหว่าง 0 ถึง 1,000,000,000 บาท');
      return;
    }

    setSaving(true);
    try {
      if (scope === 'month') {
        await onSaveMonthBudget(monthKey, parsed);
      } else {
        await onSaveDefaultBudget(parsed);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถบันทึกงบประมาณได้');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="budget-modal-title" className="font-display text-base font-semibold text-slate-900">
            ตั้งค่างบประมาณรายจ่าย
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
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => handleScopeChange('month')}
              className={`cursor-pointer rounded-md py-2 text-xs font-semibold transition-colors ${
                scope === 'month'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              เฉพาะ {formatMonthLabel(monthKey, 'short')}
            </button>
            <button
              type="button"
              onClick={() => handleScopeChange('default')}
              className={`cursor-pointer rounded-md py-2 text-xs font-semibold transition-colors ${
                scope === 'default'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ค่าเริ่มต้นทุกเดือน
            </button>
          </div>

          <div>
            <label htmlFor="budget-amount" className="mb-1.5 block text-xs font-medium text-slate-700">
              {scope === 'month'
                ? `เพดานรายจ่ายสำหรับ ${formatMonthLabel(monthKey, 'full')} (บาท)`
                : 'เพดานรายจ่ายเริ่มต้นต่อเดือน (บาท)'}
            </label>
            <input
              id="budget-amount"
              type="number"
              min="0"
              step="100"
              max={VALIDATION_LIMITS.MAX_AMOUNT}
              placeholder="เช่น 15000"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              ใส่ 0 หากต้องการปิดการแจ้งเตือนงบประมาณสำหรับช่วงเวลานี้
            </p>
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
              disabled={saving}
              className="cursor-pointer rounded-lg bg-teal-700 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกงบประมาณ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
