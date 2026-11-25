import { useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { Navbar } from './components/Navbar';
import { AnalyzerPage } from './pages/AnalyzerPage';
import { ComparePage } from './pages/ComparePage';
import { HistoryPage } from './pages/HistoryPage';
import { DashboardPage } from './pages/DashboardPage';

import { SettingsPage } from './pages/SettingsPage';
import { ToastProvider, useToastTrigger } from './components/Toast';
import { useAppStore } from './lib/store';
import type { AppView } from './lib/types';

function AppContent() {
  const {
    user, history,
    login, signup, logout,
    addToHistory, updateHistoryItem, deleteFromHistory, clearHistory,
  } = useAppStore();
  const [view, setView] = useState<AppView>('checker');
  const [useAi, setUseAi] = useState(false);
  const toast = useToastTrigger();

  if (!user) {
    return (
      <LoginPage
        onLogin={(u, p) => login(u, p)}
        onSignup={(u, p, n, r) => signup(u, p, n, r)}
      />
    );
  }

  const handleLogout = () => {
    logout();
    toast('Signed out');
  };

  const QUOTE = 'BugLens — Defect Quality Checker · "Turning confusion into clarity." · ';
  const REPEAT = QUOTE.repeat(10);

  return (
    <div className="bl-app-bg">
      <div className="bl-app-blob" />
      <div className="bl-app-marquee">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bl-app-marquee-row">
            <span className="bl-app-marquee-text">{REPEAT}</span>
            <span className="bl-app-marquee-text" aria-hidden="true">{REPEAT}</span>
          </div>
        ))}
      </div>

      <div className="bl-app-content">
        <Navbar
          user={user}
          activeView={view}
          onViewChange={setView}
          onLogout={handleLogout}
        />

        <main style={{ flex: 1 }}>
          {view === 'checker' && (
            <AnalyzerPage
              user={user}
              history={history}
              useAi={useAi}
              onAddHistory={item => addToHistory(item, user.username)}
              onUpdateHistory={item => updateHistoryItem(item, user.username)}
            />
          )}
          {view === 'compare' && (
            <ComparePage history={history} />
          )}
          {view === 'history' && (
            <HistoryPage
              history={history}
              user={user}
              onDelete={id => deleteFromHistory(id, user.username)}
              onClear={() => clearHistory(user.username)}
            />
          )}
          {view === 'dashboard' && (
            <DashboardPage history={history} user={user} />
          )}
          {view === 'settings' && (
            <SettingsPage user={user} useAi={useAi} onToggleAi={setUseAi} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <ToastProvider />
      <AppContent />
    </>
  );
}
