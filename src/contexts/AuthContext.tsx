import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { auth, googleProvider } from '../lib/firebase';
import {
  ensureUserProfile,
  subscribeToUserProfile,
} from '../services/financeService';
import type { UserProfile } from '../types/finance';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  authReady: boolean;
  authLoading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (nextUser) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setAuthReady(true);
        return;
      }

      try {
        await ensureUserProfile(nextUser);
        unsubProfile = subscribeToUserProfile(
          nextUser.uid,
          (nextProfile) => {
            setProfile(nextProfile);
            setAuthReady(true);
          },
          (err) => {
            setAuthError(err.message);
            setAuthReady(true);
          }
        );
      } catch (err) {
        setAuthError(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถเตรียมข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง'
        );
        setAuthReady(true);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) {
        unsubProfile();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('คุณได้ปิดหน้าต่างเข้าสู่ระบบก่อนดำเนินการเสร็จสิ้น');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('เบราว์เซอร์บล็อกหน้าต่างป๊อปอัป กรุณาอนุญาตป๊อปอัปแล้วลองอีกครั้ง');
      } else {
        setAuthError(
          err instanceof Error ? err.message : 'เข้าสู่ระบบด้วย Gmail ไม่สำเร็จ'
        );
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const signOutUser = async () => {
    setAuthError(null);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        authReady,
        authLoading,
        authError,
        signInWithGoogle,
        signOutUser,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
