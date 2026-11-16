const THAI_MONTHS_FULL = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

export function formatTHB(amount: number, options?: { showSign?: boolean; compact?: boolean }): string {
  const absVal = Math.abs(amount);
  let formatted: string;

  if (options?.compact) {
    if (absVal >= 1_000_000) {
      formatted = `${(absVal / 1_000_000).toFixed(1)}M`;
    } else if (absVal >= 1_000) {
      formatted = `${(absVal / 1_000).toFixed(absVal >= 10_000 ? 0 : 1)}K`;
    } else {
      formatted = absVal.toLocaleString('th-TH', { maximumFractionDigits: 0 });
    }
  } else {
    formatted = absVal.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  if (options?.showSign) {
    if (amount > 0) return `+฿${formatted}`;
    if (amount < 0) return `-฿${formatted}`;
  } else if (amount < 0) {
    return `-฿${formatted}`;
  }

  return `฿${formatted}`;
}

export function formatMonthLabel(monthKey: string, style: 'full' | 'short' = 'full'): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const monthIdx = Number(monthStr) - 1;
  if (!Number.isFinite(year) || monthIdx < 0 || monthIdx > 11) {
    return monthKey;
  }
  const buddhistYear = year + 543;
  if (style === 'short') {
    return `${THAI_MONTHS_SHORT[monthIdx]} ${String(buddhistYear).slice(-2)}`;
  }
  return `${THAI_MONTHS_FULL[monthIdx]} ${buddhistYear}`;
}

export function formatDateThai(dateStr: string): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = Number(yearStr);
  const monthIdx = Number(monthStr) - 1;
  const day = Number(dayStr);
  if (!Number.isFinite(year) || monthIdx < 0 || monthIdx > 11 || !Number.isFinite(day)) {
    return dateStr;
  }
  const buddhistYear = year + 543;
  return `${day} ${THAI_MONTHS_SHORT[monthIdx]} ${buddhistYear}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function shiftMonthKey(monthKey: string, deltaMonths: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const date = new Date(year, month + deltaMonths, 1);
  const nextY = date.getFullYear();
  const nextM = String(date.getMonth() + 1).padStart(2, '0');
  return `${nextY}-${nextM}`;
}

export function getLastNMonthKeys(anchorMonthKey: string, count: number): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(shiftMonthKey(anchorMonthKey, -i));
  }
  return keys;
}

export function getDaysInMonth(monthKey: string): number {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return 30;
  return new Date(year, month, 0).getDate();
}
