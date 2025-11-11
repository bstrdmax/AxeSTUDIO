
import React from 'react';
import { ICONS } from '../constants';
import { DashboardView } from '../types';

interface SidebarProps {
  activeView: DashboardView;
  onNavigate: (view: DashboardView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate }) => {
  return (
    <aside className="w-64 bg-[#1a102b] p-4 flex flex-col justify-between border-r border-purple-900">
      <div>
        <div className="mb-8 px-2 flex items-center space-x-3">
          <span className="w-8 h-8 text-purple-400">{ICONS.SHIELD}</span>
          <h1 className="text-2xl font-bold text-white">AxeSTUDIO</h1>
        </div>
        <nav className="flex flex-col space-y-1">
          <NavItem icon={ICONS.HOME} label="Home" active={activeView === 'home'} onClick={() => onNavigate('home')} />
          <NavItem icon={ICONS.LIBRARY} label="Library" active={activeView === 'library'} onClick={() => onNavigate('library')} />
          <NavItem icon={ICONS.DESTINATIONS} label="Destinations" active={activeView === 'destinations'} onClick={() => onNavigate('destinations')} />
        </nav>
      </div>
      <div className="p-4 text-center">
        <p className="text-xs text-gray-500">Powered by Maxwell Risk Group</p>
      </div>
    </aside>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = React.memo(({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 w-full text-left ${
      active
        ? 'bg-purple-500/40 text-purple-200'
        : 'text-gray-400 hover:bg-purple-800/50 hover:text-gray-100'
    }`}
  >
    <span className="w-5 h-5">{icon}</span>
    <span>{label}</span>
  </button>
));

export default React.memo(Sidebar);