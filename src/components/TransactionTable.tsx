import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { exportTransactionsToCsv } from '../lib/analytics';
import { formatDateThai, formatTHB } from '../lib/format';
import {
  ALL_CATEGORIES,
  getCategoryMeta,
  getPaymentMethodLabel,
  type Transaction,
  type TransactionType,
} from '../types/finance';

interface TransactionTableProps {
  transactions: Transaction[];
  monthKey: string;
  loading: boolean;
  externalCategoryFilter?: string | null;
  onClearExternalCategory?: () => void;
  onAddNew: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (txId: string) => Promise<void>;
  compact?: boolean;
  onViewAll?: () => void;
}

export function TransactionTable({
  transactions,
  monthKey,
  loading,
  externalCategoryFilter,
  onClearExternalCategory,
  onAddNew,
  onEdit,
  onDelete,
  compact = false,
  onViewAll,
}: TransactionTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeCategory = externalCategoryFilter ?? (categoryFilter === 'all' ? null : categoryFilter);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (activeCategory && tx.category !== activeCategory) return false;
      if (q) {
        const catLabel = getCategoryMeta(tx.category).label.toLowerCase();
        const hay = `${tx.title} ${tx.note} ${catLabel} ${tx.date}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, activeCategory, searchQuery]);

  const displayed = compact ? filtered.slice(0, 8) : filtered;

  const handleConfirmDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3, 4].map((row) => (
          <div key={row} className="h-11 w-full animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {(
              [
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'income', label: 'รายรับ' },
                { id: 'expense', label: 'รายจ่าย' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                className={`cursor-pointer whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  typeFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {!compact && (
            <select
              aria-label="กรองตามหมวดหมู่"
              value={externalCategoryFilter ?? categoryFilter}
              onChange={(e) => {
                if (externalCategoryFilter && onClearExternalCategory) {
                  onClearExternalCategory();
                }
                setCategoryFilter(e.target.value);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-teal-700 focus:outline-none"
            >
              <option value="all">ทุกหมวดหมู่</option>
              {ALL_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          )}

          {externalCategoryFilter && onClearExternalCategory && (
            <button
              type="button"
              onClick={onClearExternalCategory}
              className="cursor-pointer whitespace-nowrap shrink-0 text-xs font-medium text-teal-700 hover:underline"
            >
              หมวดหมู่: {getCategoryMeta(externalCategoryFilter).label} (ล้างตัวกรอง)
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารายการ..."
              aria-label="ค้นหารายการ"
              className="w-44 rounded-lg border border-slate-200 bg-white py-1.5 pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none sm:w-56"
            />
          </div>

          {!compact && filtered.length > 0 && (
            <button
              type="button"
              onClick={() => exportTransactionsToCsv(filtered, `ledger-${monthKey}.csv`)}
              className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
              ส่งออก CSV
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-slate-800">
            {transactions.length === 0
              ? 'ยังไม่มีรายการรายรับ-รายจ่ายในเดือนนี้'
              : 'ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา'}
          </p>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            {transactions.length === 0
              ? 'เริ่มต้นบันทึกรายการแรกของคุณเพื่อดูสรุปผลรายเดือนและกราฟวิเคราะห์ข้อมูล'
              : 'ลองเปลี่ยนคำค้นหา ประเภทรายการ หรือหมวดหมู่ที่เลือก'}
          </p>
          {transactions.length === 0 && (
            <button
              type="button"
              onClick={onAddNew}
              className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800"
            >
              <Plus className="h-3.5 w-3.5" />
              บันทึกรายการแรก
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[12px] font-medium text-slate-500">
                <th className="py-2.5 pr-4">รายการและรายละเอียด</th>
                <th className="hidden py-2.5 pr-4 sm:table-cell">วันที่</th>
                <th className="hidden py-2.5 pr-4 md:table-cell">ประเภท</th>
                <th className="py-2.5 pr-4 text-right">จำนวนเงิน</th>
                <th className="py-2.5 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {displayed.map((tx) => {
                const cat = getCategoryMeta(tx.category);
                const isConfirming = confirmDeleteId === tx.id;

                return (
                  <tr key={tx.id} className="group transition-colors hover:bg-slate-50/80">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-slate-900">{tx.title}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <span>{cat.label}</span>
                        <span aria-hidden="true">·</span>
                        <span>{getPaymentMethodLabel(tx.paymentMethod)}</span>
                        <span className="sm:hidden" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-mono tabular-nums sm:hidden">
                          {formatDateThai(tx.date)}
                        </span>
                        {tx.note && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="max-w-[240px] truncate text-slate-400">{tx.note}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="hidden py-3 pr-4 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap sm:table-cell">
                      {formatDateThai(tx.date)}
                    </td>
                    <td className="hidden py-3 pr-4 text-xs font-medium whitespace-nowrap md:table-cell">
                      <span className={tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}>
                        {tx.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                      </span>
                    </td>
                    <td
                      className={`py-3 pr-4 text-right font-mono text-sm font-semibold tabular-nums whitespace-nowrap ${
                        tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {formatTHB(tx.type === 'income' ? tx.amount : -tx.amount, { showSign: true })}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      {isConfirming ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            disabled={deletingId === tx.id}
                            onClick={() => handleConfirmDelete(tx.id)}
                            className="cursor-pointer rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                          >
                            {deletingId === tx.id ? 'กำลังลบ...' : 'ยืนยันลบ'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="cursor-pointer rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(tx)}
                            aria-label={`แก้ไข ${tx.title}`}
                            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(tx.id)}
                            aria-label={`ลบ ${tx.title}`}
                            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {compact && filtered.length > 8 && onViewAll && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
          <span className="text-slate-500">
            แสดง 8 จากทั้งหมด {filtered.length} รายการในเดือนนี้
          </span>
          <button
            type="button"
            onClick={onViewAll}
            className="cursor-pointer font-semibold text-teal-700 hover:text-teal-900 hover:underline"
          >
            ดูรายการทั้งหมด →
          </button>
        </div>
      )}
    </div>
  );
}
