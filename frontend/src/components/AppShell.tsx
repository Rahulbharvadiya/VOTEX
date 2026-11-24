import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, History, PlusCircle, LogOut } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  activeTab: 'studio' | 'workspace' | 'history';
  onNavigate: (tab: 'studio' | 'workspace' | 'history', taskId?: string) => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, activeTab, onNavigate }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => onNavigate('studio')}
              className="flex items-center space-x-2 text-indigo-600 font-extrabold text-xl tracking-wider hover:opacity-90"
            >
              <Sparkles className="h-6 w-6 text-indigo-600" />
              <span>VOTEX</span>
            </button>
            <nav className="flex space-x-2">
              <button
                onClick={() => onNavigate('studio')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-colors ${
                  activeTab === 'studio'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Voice Studio</span>
              </button>
              <button
                onClick={() => onNavigate('workspace')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'workspace'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <PlusCircle className="h-4 w-4" />
                <span>Agent Tasks</span>
              </button>
              <button
                onClick={() => onNavigate('history')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <History className="h-4 w-4" />
                <span>History</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-600 hidden sm:inline-block">
              {user?.email}
            </span>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-2 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
