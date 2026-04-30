import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  user: null | { id: string; username: string; role: string; email: string; firstName?: string; lastName?: string; };
  setAuth: (user: AuthState['user']) => void;
  logout: () => void;
}

function syncSpeechAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;
  void window.api?.speech?.setAuthToken?.(token ?? null);
}

export const useAuthStore = create<AuthState>((set) => {
  let initialUser = null;
  if (typeof window !== 'undefined') {
    try {
      const storedUser = localStorage.getItem('qworship_user');
      if (storedUser) {
        initialUser = JSON.parse(storedUser);
      }
    } catch (e) {
      console.error('Failed to parse stored user', e);
    }
  }

  return {
    isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false,
    user: initialUser,
    setAuth: (user) => {
      localStorage.setItem('qworship_user', JSON.stringify(user));
      syncSpeechAuthToken(localStorage.getItem('token'));
      set({ isAuthenticated: true, user });
    },
    logout: () => {
      localStorage.removeItem('token');
      sessionStorage.removeItem('qworship_user_id');
      localStorage.removeItem('qworship_user');
      syncSpeechAuthToken(null);
      set({ isAuthenticated: false, user: null });
    },
  };
});
