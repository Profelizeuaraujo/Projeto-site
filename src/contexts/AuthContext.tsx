import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { fetchAuthSession } from '../lib/api';
import type { AuthSessionProfile } from '../types/site';

interface AuthContextValue {
  user: User | null;
  session: AuthSessionProfile | null;
  isAdmin: boolean;
  loading: boolean;
  verifyingRole: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  switchAccount: () => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function formatFirebaseError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: string }).code)
      : '';

  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'A janela de login foi fechada antes da conclusão. Tente novamente.';
  }
  if (code === 'auth/popup-blocked') {
    return 'O navegador bloqueou a janela de login do Google. Permita pop-ups para este site e tente novamente.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'Este domínio não está autorizado no Firebase Authentication.';
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'Não foi possível concluir a autenticação com o Google.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSessionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyingRole, setVerifyingRole] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const verifyUserSession = useCallback(async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setSession(null);
      setVerifyingRole(false);
      return;
    }

    setVerifyingRole(true);
    setAuthError(null);
    try {
      const token = await firebaseUser.getIdToken();
      const profile = await fetchAuthSession(token);
      setSession(profile);
    } catch (err: unknown) {
      setSession(null);
      setAuthError(formatFirebaseError(err));
    } finally {
      setVerifyingRole(false);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      void verifyUserSession(firebaseUser);
    });
    return unsub;
  }, [verifyUserSession]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: unknown) {
      setAuthError(formatFirebaseError(err));
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthError(null);
    setSession(null);
    await signOut(auth);
  }, []);

  const switchAccount = useCallback(async () => {
    setAuthError(null);
    setSession(null);
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: unknown) {
      setAuthError(formatFirebaseError(err));
    }
  }, []);

  const refreshSession = useCallback(async () => {
    await verifyUserSession(auth.currentUser);
  }, [verifyUserSession]);

  const getToken = useCallback(async (): Promise<string> => {
    const current = auth.currentUser;
    if (!current) {
      throw new Error('Sessão não autenticada.');
    }
    return current.getIdToken();
  }, []);

  const isAdmin = Boolean(user && session?.isAdmin);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        loading,
        verifyingRole,
        authError,
        signInWithGoogle,
        switchAccount,
        refreshSession,
        logout,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider.');
  }
  return ctx;
}
