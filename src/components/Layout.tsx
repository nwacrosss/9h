import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Activity, Clock } from 'lucide-react';
import { Toaster } from 'sonner';

export function Layout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-base text-text font-sans">
      {/* Toast notifications configured with soft Catppuccin styles */}
      <Toaster 
        theme={theme} 
        richColors 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'var(--ctp-mantle)',
            color: 'var(--ctp-text)',
            border: '1px solid var(--ctp-surface0)',
            borderRadius: '16px',
            boxShadow: 'none',
          }
        }} 
      />

      {/* Floating Modern Header */}
      <div className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto pt-2">
        <header className="bg-mantle/80 backdrop-blur-xl border border-surface0 rounded-2xl transition-colors">
          <div className="px-3 sm:px-6">
            <div className="flex justify-between items-center h-14">
              <div className="flex items-center space-x-3 sm:space-x-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-lavender/10 rounded-lg shrink-0">
                    <Activity className="h-5 w-5 text-lavender" />
                  </div>
                  <span className="font-bold text-base tracking-tight text-text hidden sm:block">
                    VN Edu Tracker
                  </span>
                </div>
                
                <nav className="flex space-x-1 sm:space-x-2">
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-surface0/80 text-lavender' 
                          : 'text-subtext0 hover:bg-surface0/50 hover:text-text'
                      }`
                    }
                  >
                    <Activity className="h-4 w-4 shrink-0" />
                    <span>Bảng số liệu</span>
                  </NavLink>
                  <NavLink
                    to="/logs"
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-surface0/80 text-lavender' 
                          : 'text-subtext0 hover:bg-surface0/50 hover:text-text'
                      }`
                    }
                  >
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>Timeline</span>
                  </NavLink>
                </nav>
              </div>

              <div className="flex items-center">
                <button
                  onClick={toggleTheme}
                  className="p-1.5 sm:p-2 rounded-xl text-subtext0 hover:bg-surface0/80 hover:text-text transition-colors shrink-0"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-sapphire" />}
                </button>
              </div>
            </div>
          </div>
        </header>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>

      <footer className="py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-subtext0 font-medium">
          Dữ liệu trực tiếp từ VN Edu. Styled with Catppuccin.
        </div>
      </footer>
    </div>
  );
}
