import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Home, ClipboardList, PlusCircle, User, LogOut, Menu, X, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { auth } from '../firebase';
import { cn } from '../lib/utils';
import NotificationDropdown from './NotificationDropdown';
import AccessibilityWidget from './AccessibilityWidget';

export default function Layout() {
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const navItems = [
    { name: 'Início', path: '/', icon: Home },
    { name: 'Solicitações', path: '/solicitacoes', icon: ClipboardList },
    { name: 'Nova Solicitação', path: '/nova-solicitacao', icon: PlusCircle },
    { name: 'Perfil', path: '/perfil', icon: User },
  ];

  if (profile?.tipo === 'Admin') {
    navItems.push({ name: 'Admin', path: '/admin', icon: ClipboardList });
  }

  const handleLogout = () => auth.signOut();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col md:w-20 lg:w-64 sidebar border-r sticky top-0 h-screen transition-all duration-300">
        <div className="p-6 flex justify-center lg:justify-start">
          <h1 className="text-2xl font-bold text-primary hidden lg:block">EduRequest</h1>
          <h1 className="text-2xl font-bold text-primary lg:hidden">ER</h1>
        </div>
        
        <nav className="flex-1 px-2 lg:px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              title={item.name}
              className={cn(
                "flex items-center lg:space-x-3 px-3 lg:px-4 py-3 rounded-xl transition-all justify-center lg:justify-start",
                location.pathname === item.path
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <item.icon size={20} />
              <span className="hidden lg:block">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-2 lg:p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between px-2 lg:px-4 py-2">
            <span className="text-[10px] lg:text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:block">Preferências</span>
            <NotificationDropdown align="left" />
          </div>
          <button
            onClick={toggleTheme}
            title={`Modo ${theme === 'Claro' ? 'Escuro' : 'Claro'}`}
            className="flex items-center lg:space-x-3 w-full px-3 lg:px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all justify-center lg:justify-start"
          >
            {theme === 'Claro' ? <Sun size={20} /> : <Moon size={20} />}
            <span className="hidden lg:block">Modo {theme === 'Claro' ? 'Claro' : 'Escuro'}</span>
          </button>
          <button
            onClick={handleLogout}
            title="Sair"
            className="flex items-center lg:space-x-3 w-full px-3 lg:px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all justify-center lg:justify-start"
          >
            <LogOut size={20} />
            <span className="hidden lg:block">Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 sidebar border-b sticky top-0 z-50">
        <h1 className="text-xl font-bold text-primary">EduRequest</h1>
        <div className="flex items-center space-x-4">
          <button onClick={toggleTheme} className="text-slate-600 dark:text-slate-400">
            {theme === 'Claro' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <NotificationDropdown />
          <button 
            onClick={handleLogout} 
            className="text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 pb-24 md:pb-8 max-w-7xl mx-auto w-full transition-all duration-300">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 sidebar border-t flex justify-around p-2 z-50">
        {navItems.slice(0, 4).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center p-2 rounded-lg transition-all",
              location.pathname === item.path
                ? "text-primary"
                : "text-slate-500 dark:text-slate-400"
            )}
          >
            <item.icon size={20} />
            <span className="text-[10px] mt-1">{item.name}</span>
          </Link>
        ))}
      </nav>
      
      {/* Universal Floating Accessibility Widget */}
      <AccessibilityWidget />
    </div>
  );
}
