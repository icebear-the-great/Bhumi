import React from 'react';
import { ICONS } from '../constants';
import { User } from '../types';
import { db } from '../services/db';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, onLogout }) => {
  const isDemo = db.isDemo;
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ICONS.Dashboard },
    { id: 'pipeline', label: 'Idea Pipeline', icon: ICONS.Pipeline },
    { id: 'campaigns', label: 'Initiatives', icon: ICONS.Campaigns },
    // { id: 'market-intelligence', label: 'Market Intel', icon: ICONS.Globe }, // Hidden
    { id: 'users', label: 'Team', icon: ICONS.Users },
  ];

  // Only show Admin Settings for Marketing Lead (or equivalent admin role)
  if (user.role === 'Marketing Lead') {
      navItems.push({ id: 'admin', label: 'Admin Settings', icon: ICONS.Settings });
  }

  return (
    <div className="flex h-screen bg-sand-100 text-sand-900 font-sans overflow-hidden">
      {/* Sidebar - Updated background to earth-300 (#d2c9bf) */}
      <aside className="w-64 bg-earth-300 text-bhumi-900 flex flex-col shadow-xl z-20 border-r border-sand-300">
        <div className="p-6 flex flex-col gap-1 border-b border-sand-400/30">
          <div className="flex items-center gap-3">
              <img 
                src="/bhumi-logo.png"
                alt="BhumiHub" 
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }} 
              />
              <span className="font-bold text-2xl tracking-tight text-bhumi-900">BhumiHub</span>
          </div>
          {/* Connection Badge */}
          <div className="flex items-center gap-2 mt-2 px-1">
             <span className={`w-2 h-2 rounded-full ${isDemo ? 'bg-orange-500' : 'bg-green-500 animate-pulse'}`}></span>
             <span className="text-[10px] uppercase font-bold text-bhumi-800 tracking-wider">
                 {isDemo ? 'Demo Mode' : 'Connected'}
             </span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-bhumi-900 text-white shadow-md' 
                  : 'text-bhumi-900/70 hover:bg-white/40 hover:text-bhumi-900'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-sand-400/30">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/30 rounded-xl relative group">
            <div className="w-8 h-8 rounded-full bg-bhumi-900 flex items-center justify-center text-xs font-bold text-white shadow-sm uppercase">
              {user.name.charAt(0) + (user.name.split(' ')[1]?.[0] || '')}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-sm font-medium text-bhumi-900 truncate">{user.name}</span>
              <span className="text-xs text-bhumi-800/70 truncate">{user.role}</span>
            </div>
            <button 
                onClick={onLogout}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-bhumi-900 hover:text-red-600 bg-white/50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                title="Log Out"
            >
                {ICONS.LogOut}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-sand-100">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-sand-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h1 className="text-2xl font-bold text-bhumi-900 capitalize tracking-tight">
            {navItems.find(n => n.id === activeTab)?.label}
          </h1>
          {/* Right side empty for now, branding moved to sidebar */}
        </header>
        
        <div className="flex-1 overflow-auto p-8 relative">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
