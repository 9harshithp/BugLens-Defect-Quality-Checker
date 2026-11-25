import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '../components/Navbar';
import { HistoryPage } from '../pages/HistoryPage';
import { ToastProvider } from '../components/Toast';
import { ruleBasedAnalysis } from '../lib/analysis';
import type { HistoryItem, User } from '../lib/types';

const mockUser: User = { username: 'qa_lead', name: 'Quinn Arora', role: 'QA Lead' };

describe('Navbar', () => {
  it('renders the 5 v2.0 tabs without Jira', () => {
    render(<Navbar user={mockUser} activeView="checker" onViewChange={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.getByTestId('tab-checker')).toBeInTheDocument();
    expect(screen.getByTestId('tab-compare')).toBeInTheDocument();
    expect(screen.getByTestId('tab-history')).toBeInTheDocument();
    expect(screen.getByTestId('tab-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('tab-settings')).toBeInTheDocument();
    expect(screen.queryByTestId('tab-jira')).not.toBeInTheDocument();
  });
});

describe('HistoryPage', () => {
  it('filters history items by search query', () => {
    const fieldsA = {
      title: 'Login 2FA button unresponsive', desc: 'Button does not respond on click.',
      steps: '1. Open login\n2. Click button', exp: 'Submits form', act: 'Nothing happens',
      env: 'Safari 17', sev: 'High', pri: 'P2', comp: 'Auth', rep: 'QA', exc: '', att: '',
    };
    const fieldsB = {
      ...fieldsA, title: 'Database connection pool timeout', comp: 'Database',
    };
    const items: HistoryItem[] = [
      { id: 1, timestamp: Date.now(), title: fieldsA.title, score: 80, grade: 'Good', parsed: ruleBasedAnalysis(fieldsA), fields: fieldsA },
      { id: 2, timestamp: Date.now() - 1000, title: fieldsB.title, score: 65, grade: 'Needs Improvement', parsed: ruleBasedAnalysis(fieldsB), fields: fieldsB },
    ];

    render(
      <>
        <ToastProvider />
        <HistoryPage history={items} user={mockUser} onDelete={vi.fn()} onClear={vi.fn()} />
      </>
    );

    expect(screen.getByText('Login 2FA button unresponsive')).toBeInTheDocument();
    expect(screen.getByText('Database connection pool timeout')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('input-history-search'), { target: { value: 'Database' } });
    expect(screen.queryByText('Login 2FA button unresponsive')).not.toBeInTheDocument();
    expect(screen.getByText('Database connection pool timeout')).toBeInTheDocument();
  });
});

