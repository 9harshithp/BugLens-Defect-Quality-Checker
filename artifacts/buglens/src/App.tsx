import { useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { Navbar } from './components/Navbar';
import { AnalyzerPage } from './pages/AnalyzerPage';
import { ComparePage } from './pages/ComparePage';
import { HistoryPage } from './pages/HistoryPage';
import { DashboardPage } from './pages/DashboardPage';
import { TeamFeedPage } from './pages/TeamFeedPage';
import { ToastProvider, useToastTrigger } from './components/Toast';
import { useAppStore } from './lib/store';
import type { AppView } from './lib/types';

function AppContent() {
  const {
    user, history, teamFeed,
    login, signup, logout,
    addToHistory, deleteFromHistory, clearHistory,
    shareToTeam, addComment, removeFromTeamFeed,
  } = useAppStore();
  const [view, setView] = useState<AppView>('checker');
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
          teamCount={teamFeed.length}
        />

        <main style={{ flex: 1 }}>
          {view === 'checker' && (
            <AnalyzerPage
              user={user}
              onAddHistory={item => addToHistory(item, user.username)}
              onShareToTeam={item => {
                const ok = shareToTeam(item, user);
                if (ok) { toast('👥 Shared to Team Feed!'); setView('team'); }
                else toast('Already shared to team feed');
                return ok;
              }}
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
          {view === 'team' && (
            <TeamFeedPage
              teamFeed={teamFeed}
              user={user}
              onAddComment={(feedId, text, u) => addComment(feedId, text, u)}
              onRemove={feedId => { removeFromTeamFeed(feedId); toast('Removed from team feed'); }}
            />
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
