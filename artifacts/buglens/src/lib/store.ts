import { useState, useCallback, useEffect } from 'react';
import type { HistoryItem, User, TeamFeedItem, TeamComment } from './types';

const BUILTIN_USERS: Record<string, { password: string; role: string; name: string }> = {
  admin:    { password: 'admin123', role: 'Admin',     name: 'Alex Admin' },
  qa_lead:  { password: 'qa1234',   role: 'QA Lead',   name: 'Quinn Arora' },
  dev_user: { password: 'dev5678',  role: 'Developer', name: 'Dev Patel' },
  analyst:  { password: 'pass2024', role: 'Analyst',   name: 'Ana Silva' },
};

const USERS_STORE_KEY   = 'bl_registered_users';
const TEAM_FEED_KEY     = 'bl_team_feed';

function loadRegisteredUsers(): Record<string, { password: string; role: string; name: string }> {
  try {
    const raw = localStorage.getItem(USERS_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveRegisteredUsers(users: Record<string, { password: string; role: string; name: string }>) {
  localStorage.setItem(USERS_STORE_KEY, JSON.stringify(users));
}

function loadTeamFeedFromStorage(): TeamFeedItem[] {
  try {
    const raw = localStorage.getItem(TEAM_FEED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveTeamFeed(feed: TeamFeedItem[]) {
  localStorage.setItem(TEAM_FEED_KEY, JSON.stringify(feed));
}

export function useAppStore() {
  const [user, setUser]         = useState<User | null>(null);
  const [history, setHistory]   = useState<HistoryItem[]>([]);
  const [teamFeed, setTeamFeed] = useState<TeamFeedItem[]>(loadTeamFeedFromStorage);

  useEffect(() => {
    const interval = setInterval(() => {
      const fresh = loadTeamFeedFromStorage();
      setTeamFeed(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(fresh)) return fresh;
        return prev;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const resolveUser = (username: string): { password: string; role: string; name: string } | undefined => {
    const builtin = BUILTIN_USERS[username];
    if (builtin) return builtin;
    const registered = loadRegisteredUsers();
    return registered[username];
  };

  const login = useCallback((username: string, password: string): boolean => {
    const u = resolveUser(username);
    if (u && u.password === password) {
      const cu: User = { username, role: u.role, name: u.name };
      setUser(cu);
      try {
        const saved = localStorage.getItem(`bl_${username}`);
        setHistory(saved ? JSON.parse(saved) : []);
      } catch { setHistory([]); }
      setTeamFeed(loadTeamFeedFromStorage());
      return true;
    }
    return false;
  }, []);

  const signup = useCallback((
    username: string,
    password: string,
    name: string,
    role: string
  ): { ok: boolean; error?: string } => {
    if (!username.trim() || !password.trim() || !name.trim()) {
      return { ok: false, error: 'Username, password, and name are required.' };
    }
    if (username.length < 3) {
      return { ok: false, error: 'Username must be at least 3 characters.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
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
    setTeamFeed(loadTeamFeedFromStorage());
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setHistory([]);
  }, []);

  const addToHistory = useCallback((item: HistoryItem, username: string) => {
    setHistory(prev => {
      const next = [item, ...prev].slice(0, 50);
      localStorage.setItem(`bl_${username}`, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteFromHistory = useCallback((id: number, username: string) => {
    setHistory(prev => {
      const next = prev.filter(h => h.id !== id);
      localStorage.setItem(`bl_${username}`, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback((username: string) => {
    localStorage.setItem(`bl_${username}`, '[]');
    setHistory([]);
  }, []);

  const shareToTeam = useCallback((item: HistoryItem, sharedBy: User): boolean => {
    const existing = loadTeamFeedFromStorage();
    const alreadyShared = existing.some(f => f.id === item.id);
    if (alreadyShared) return false;
    const feedItem: TeamFeedItem = {
      id: item.id,
      timestamp: Date.now(),
      sharedBy,
      reportTitle: item.title,
      score: item.score,
      grade: item.grade,
      parsed: item.parsed,
      fields: item.fields,
      comments: [],
    };
    const next = [feedItem, ...existing].slice(0, 100);
    saveTeamFeed(next);
    setTeamFeed(next);
    return true;
  }, []);

  const addComment = useCallback((feedId: number, text: string, commenter: User) => {
    setTeamFeed(prev => {
      const next = prev.map(item => {
        if (item.id !== feedId) return item;
        const comment: TeamComment = {
          id: Date.now(),
          timestamp: Date.now(),
          username: commenter.username,
          name: commenter.name,
          role: commenter.role,
          text,
        };
        return { ...item, comments: [...item.comments, comment] };
      });
      saveTeamFeed(next);
      return next;
    });
  }, []);

  const removeFromTeamFeed = useCallback((feedId: number) => {
    setTeamFeed(prev => {
      const next = prev.filter(f => f.id !== feedId);
      saveTeamFeed(next);
      return next;
    });
  }, []);

  return {
    user, history, teamFeed,
    login, signup, logout,
    addToHistory, deleteFromHistory, clearHistory,
    shareToTeam, addComment, removeFromTeamFeed,
  };
}
