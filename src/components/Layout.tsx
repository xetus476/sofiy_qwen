import { NavLink, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { initTelegram, getThemeColors, getColorScheme } from '../lib/telegram';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', icon: '🏠', label: 'Главная' },
  { to: '/stats', icon: '📊', label: 'Статистика' },
  { to: '/goals', icon: '🎯', label: 'Цели' },
  { to: '/analytics', icon: '📈', label: 'Аналитика' },
];

export function Layout() {
  const { loading } = useAuth();

  useEffect(() => {
    initTelegram();
    
    const colors = getThemeColors();
    const root = document.documentElement;
    root.style.setProperty('--tg-theme-bg-color', colors.bg_color);
    root.style.setProperty('--tg-theme-text-color', colors.text_color);
    root.style.setProperty('--tg-theme-hint-color', colors.hint_color);
    root.style.setProperty('--tg-theme-button-color', colors.button_color);
    root.style.setProperty('--tg-theme-button-text-color', colors.button_text_color);
    root.style.setProperty('--tg-theme-secondary-bg-color', colors.secondary_bg_color);
    
    const scheme = getColorScheme();
    root.classList.remove('light', 'dark');
    root.classList.add(scheme);
  }, []);

  // Экран загрузки
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[var(--tg-theme-bg-color)]">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">💰</div>
          <p className="text-[var(--tg-theme-text-color)] text-lg font-semibold">Загрузка...</p>
          <p className="text-[var(--tg-theme-hint-color)] text-sm mt-2">FinanceBot Mini App</p>
          <div className="mt-4 w-32 h-1 bg-[var(--tg-theme-secondary-bg-color)] rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-[var(--tg-theme-button-color)] rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)]">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto pb-20 overscroll-contain">
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--tg-theme-bg-color)]/95 backdrop-blur-lg border-t border-[var(--lavender-200)]/50 z-30"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                  isActive
                    ? 'text-[var(--tg-theme-button-color)]'
                    : 'text-[var(--tg-theme-hint-color)] hover:text-[var(--tg-theme-text-color)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`text-xl mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                    {item.icon}
                  </div>
                  <span className={`text-[10px] font-medium transition-all ${isActive ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-2 w-1 h-1 rounded-full bg-[var(--tg-theme-button-color)]"></div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
