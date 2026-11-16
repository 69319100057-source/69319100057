import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './components/DashboardLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginView } from './components/LoginView';

function AppShell() {
  const { user, authReady } = useAuth();

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" />
          <p className="text-xs font-medium text-slate-500">กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  return user ? <DashboardLayout /> : <LoginView />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ErrorBoundary>
  );
}
