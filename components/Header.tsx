import React from 'react';
import { AppView } from '../types';
import { ChartBarIcon, DumbbellIcon, AppleIcon, LogoutIcon } from './common/Icons';

interface HeaderProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  onLogout: () => void;
}

const NavItem: React.FC<{
  label: string;
  view: AppView;
  currentView: AppView;
  setView: (view: AppView) => void;
  icon: React.ReactNode;
}> = ({ label, view, currentView, setView, icon }) => {
  const isActive = view === currentView;
  return (
    <button
      onClick={() => setView(view)}
      aria-label={label}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
        isActive ? 'bg-violet-500/30 text-violet-300' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({ currentView, setView, onLogout }) => {
  return (
    <header className="bg-gray-900/70 border-b border-gray-700/50 sticky top-0 z-40 backdrop-blur-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl sm:text-2xl font-bold font-righteous animated-gradient-text">TerbrasFit</h1>
          </div>
          <div className="flex items-center space-x-2">
            <nav className="flex space-x-2">
              <NavItem label="Dashboard" view="DASHBOARD" currentView={currentView} setView={setView} icon={<ChartBarIcon className="h-5 w-5" />} />
              <NavItem label="Exercise" view="EXERCISE" currentView={currentView} setView={setView} icon={<DumbbellIcon className="h-5 w-5" />} />
              <NavItem label="Nutrition" view="NUTRITION" currentView={currentView} setView={setView} icon={<AppleIcon className="h-5 w-5" />} />
            </nav>
             <div className="border-l border-gray-700/50 h-8 mx-2"></div>
             <button
              onClick={onLogout}
              aria-label="Logout"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 text-gray-400 hover:bg-red-500/20 hover:text-red-400"
            >
              <LogoutIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;