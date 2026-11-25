import { useState, useCallback, useEffect } from 'react';
import type { HistoryItem, User } from './types';

const BUILTIN_USERS: Record<string, { password: string; role: string; name: string }> = {
  admin:    { password: 'admin123', role: 'Administrator',      name: 'Alex Admin' },
  qa_lead:  { password: 'qa1234',   role: 'QA Lead',            name: 'Quinn Arora' },
  dev_user: { password: 'dev5678',  role: 'Software Developer', name: 'Dev Patel' },
  analyst:  { password: 'pass2024', role: 'Business Analyst',   name: 'Ana Silva' },
};

const USERS_STORE_KEY = 'bl_registered_users';

function loadRegisteredUsers(): Record<string, { password: string; role: string; name: string }> {
  try {
    const raw = localStorage.getItem(USERS_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveRegisteredUsers(users: Record<string, { password: string; role: string; name: string }>) {
  localStorage.setItem(USERS_STORE_KEY, JSON.stringify(users));
}

function loadLocalHistory(username: string): HistoryItem[] {
  try {
    const saved = localStorage.getItem(`bl_${username}`);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

export function useAppStore() {
  const [user, setUser]       = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async res => {
        if (!res.ok) return;
        const data = await res.json() as { user?: User };
        if (!data.user) return;
        setUser(data.user);
        const repRes = await fetch('/api/reports', { credentials: 'include' });
        if (repRes.ok) {
          const repData = await repRes.json() as { reports?: HistoryItem[] };
          if (Array.isArray(repData.reports)) {
            setHistory(repData.reports);
            localStorage.setItem(`bl_${data.user.username}`, JSON.stringify(repData.reports));
            return;
          }
        }
        setHistory(loadLocalHistory(data.user.username));
      })
      .catch(() => {});
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json() as { user: User };
        setUser(data.user);
        const repRes = await fetch('/api/reports', { credentials: 'include' });
        if (repRes.ok) {
          const repData = await repRes.json() as { reports?: HistoryItem[] };
          if (Array.isArray(repData.reports)) {
            setHistory(repData.reports);
            localStorage.setItem(`bl_${data.user.username}`, JSON.stringify(repData.reports));
            return true;
          }
        }
        setHistory(loadLocalHistory(data.user.username));
        return true;
      }
      if (res.status === 401 || res.status === 400) return false;
    } catch {
      // Offline fallback below
    }

    const u = BUILTIN_USERS[username] || loadRegisteredUsers()[username];
    if (u && u.password === password) {
      const cu: User = { username, role: u.role, name: u.name };
      setUser(cu);
      setHistory(loadLocalHistory(username));
      return true;
    }
    return false;
  }, []);

  const signup = useCallback(async (
    username: string,
    password: string,
    name: string,
    role: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!username.trim() || !password.trim() || !name.trim()) {
      return { ok: false, error: 'Username, password, and name are required.' };
    }
    if (username.length < 3) {
      return { ok: false, error: 'Username must be at least 3 characters.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password, name: name.trim(), role }),
      });
      const data = await res.json().catch(() => ({})) as { user?: User; error?: string };
      if (res.ok && data.user) {
        setUser(data.user);
        setHistory([]);
        return { ok: true };
      }
      if (res.status === 400 || res.status === 409) {
        return { ok: false, error: data.error || 'Signup failed.' };
      }
    } catch {
      // Offline fallback below
    }

    if (BUILTIN_USERS[username]) {
      return { ok: false, error: 'That username is already taken.' };
    }
    const registered = loadRegisteredUsers();
    if (registered[username]) {
      return { ok: false, error: 'That username is already taken.' };
    }
    registered[username] = { password, role, name: name.trim() };
    saveRegisteredUsers(registered);
    const cu: User = { username, role, name: name.trim() };
    setUser(cu);
    setHistory([]);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setUser(null);
    setHistory([]);
  }, []);

  const addToHistory = useCallback((item: HistoryItem, username: string) => {
    setHistory(prev => {
      const next = [item, ...prev].slice(0, 50);
      localStorage.setItem(`bl_${username}`, JSON.stringify(next));
      return next;
    });
    fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(item),
    }).catch(() => {});
  }, []);

  const updateHistoryItem = useCallback((item: HistoryItem, username: string) => {
    setHistory(prev => {
      const next = prev.map(h => (h.id === item.id ? item : h));
      localStorage.setItem(`bl_${username}`, JSON.stringify(next));
      return next;
    });
    fetch(`/api/reports/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ parsed: item.parsed, isDraft: item.isDraft }),
    }).catch(() => {});
  }, []);

  const deleteFromHistory = useCallback((id: number, username: string) => {
    setHistory(prev => {
      const next = prev.filter(h => h.id !== id);
      localStorage.setItem(`bl_${username}`, JSON.stringify(next));
      return next;
    });
    fetch(`/api/reports/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    }).catch(() => {});
  }, []);

  const clearHistory = useCallback((username: string) => {
    localStorage.setItem(`bl_${username}`, '[]');
    setHistory([]);
    fetch('/api/reports', {
      method: 'DELETE',
      credentials: 'include',
    }).catch(() => {});
  }, []);

  return {
    user, history,
    login, signup, logout,
    addToHistory, updateHistoryItem, deleteFromHistory, clearHistory,
  };
}
