import { AlertCircle, ArrowRight, BarChart3, CalendarRange, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FIREBASE_PROJECT_ID } from '../lib/firebase';

export function LoginView() {
  const { signInWithGoogle, authLoading, authError, clearAuthError } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-8 border-b border-slate-200 px-6 py-4">
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          KlangLedger
        </span>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <a href="#features" className="whitespace-nowrap shrink-0 transition-colors hover:text-slate-900">
            ความสามารถหลัก
          </a>
          <a href="#security" className="whitespace-nowrap shrink-0 transition-colors hover:text-slate-900">
            การจัดเก็บข้อมูล
          </a>
        </nav>
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={authLoading}
          className="cursor-pointer whitespace-nowrap shrink-0 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {authLoading ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย Gmail'}
        </button>
      </header>

      {/* Main Split Section */}
      <main className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
          {/* Left Column */}
          <div className="flex flex-col justify-between lg:col-span-6 lg:py-4">
            <div>
              <p className="text-xs font-medium text-teal-800">
                สมุดบัญชีรายรับรายจ่ายส่วนบุคคล · Firebase {FIREBASE_PROJECT_ID}
              </p>
              <h1 className="mt-3 max-w-xl font-display text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance] sm:text-4xl">
                จัดการรายรับรายจ่าย สรุปผลรายเดือน และวิเคราะห์กระแสเงินสดอย่างเป็นระบบ
              </h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600">
                บันทึกทุกรายการได้ทันที แยกหมวดหมู่รายรับ-รายจ่ายอัตโนมัติ ติดตามงบประมาณรายเดือน พร้อมกราฟวิเคราะห์แนวโน้มและสัดส่วนค่าใช้จ่ายที่บันทึกปลอดภัยบนบัญชี Gmail ของคุณ
              </p>

              {authError && (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <div className="flex-1">
                    <p className="font-medium">ไม่สามารถเข้าสู่ระบบได้</p>
                    <p className="mt-0.5 text-xs text-rose-700">{authError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearAuthError}
                    className="cursor-pointer text-xs font-medium text-rose-700 hover:underline"
                  >
                    ปิด
                  </button>
                </div>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={authLoading}
                  className="inline-flex cursor-pointer items-center gap-3 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                    />
                  </svg>
                  <span>{authLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Gmail'}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>

            <div id="features" className="mt-12 grid grid-cols-1 gap-6 border-t border-slate-200 pt-8 sm:grid-cols-3">
              <div>
                <CalendarRange className="h-4 w-4 text-teal-700" />
                <h2 className="mt-2.5 text-sm font-semibold text-slate-900">สรุปผลรายเดือน</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  เปรียบเทียบรายรับ รายจ่าย ยอดคงเหลือ และอัตราการออมเทียบเดือนก่อนหน้า
                </p>
              </div>
              <div>
                <BarChart3 className="h-4 w-4 text-teal-700" />
                <h2 className="mt-2.5 text-sm font-semibold text-slate-900">กราฟวิเคราะห์ข้อมูล</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  ดูแนวโน้ม 6–12 เดือน กระแสเงินสดรายวัน และสัดส่วนค่าใช้จ่ายตามหมวดหมู่
                </p>
              </div>
              <div id="security">
                <ShieldCheck className="h-4 w-4 text-teal-700" />
                <h2 className="mt-2.5 text-sm font-semibold text-slate-900">แยกข้อมูลเฉพาะบัญชี</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  ข้อมูลถูกจัดเก็บใน Firestore และจำกัดสิทธิ์เข้าถึงเฉพาะ Gmail ที่ยืนยันตัวตนแล้ว
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Ledger Structural Preview */}
          <div className="lg:col-span-6">
            <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">ตัวอย่างมุมมองสรุปรายเดือน</p>
                  <p className="mt-0.5 font-display text-lg font-semibold text-slate-900">
                    พฤศจิกายน 2569
                  </p>
                </div>
                <span className="font-mono text-xs text-slate-400">69319100057DB</span>
              </div>

              {/* Metric Row */}
              <div className="my-6 grid grid-cols-3 gap-4 border-b border-slate-100 pb-6">
                <div>
                  <p className="text-xs text-slate-500">รายรับรวม</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-emerald-700 tabular-nums">
                    +฿48,500
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">รายจ่ายรวม</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-rose-700 tabular-nums">
                    -฿21,340
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">คงเหลือสุทธิ</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-slate-900 tabular-nums">
                    ฿27,160
                  </p>
                </div>
              </div>

              {/* Clean SVG Chart Motif */}
              <div>
                <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                  <span>แนวโน้มรายรับ-รายจ่าย 6 เดือน</span>
                  <span className="font-mono tabular-nums">THB</span>
                </div>
                <svg viewBox="0 0 420 150" className="h-auto w-full" aria-hidden="true">
                  {[25, 55, 85, 115].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="420"
                      y2={y}
                      stroke="#F1F5F9"
                      strokeWidth="1"
                    />
                  ))}
                  {[
                    { x: 24, inc: 68, exp: 42, lbl: 'มิ.ย.' },
                    { x: 92, inc: 78, exp: 49, lbl: 'ก.ค.' },
                    { x: 160, inc: 72, exp: 38, lbl: 'ส.ค.' },
                    { x: 228, inc: 88, exp: 52, lbl: 'ก.ย.' },
                    { x: 296, inc: 84, exp: 44, lbl: 'ต.ค.' },
                    { x: 364, inc: 96, exp: 46, lbl: 'พ.ย.' },
                  ].map((m) => (
                    <g key={m.lbl}>
                      <rect
                        x={m.x}
                        y={120 - m.inc}
                        width="16"
                        height={m.inc}
                        rx="3"
                        fill="#16A34A"
                        opacity="0.85"
                      />
                      <rect
                        x={m.x + 20}
                        y={120 - m.exp}
                        width="16"
                        height={m.exp}
                        rx="3"
                        fill="#DC2626"
                        opacity="0.85"
                      />
                      <text
                        x={m.x + 18}
                        y="142"
                        textAnchor="middle"
                        className="fill-slate-400 text-[11px]"
                      >
                        {m.lbl}
                      </text>
                    </g>
                  ))}
                  <polyline
                    fill="none"
                    stroke="#0F766E"
                    strokeWidth="2"
                    points="42,94 110,91 178,86 246,84 314,80 382,70"
                  />
                </svg>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
                รองรับการส่งออกรายงาน CSV สำหรับ Microsoft Excel และ Google Sheets
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
