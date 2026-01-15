import React, { useState } from 'react';
import { AppConfig } from '../types';
import { ICONS } from '../constants';

interface AdminSettingsProps {
  config: AppConfig;
  onUpdateConfig: (config: AppConfig) => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ config, onUpdateConfig }) => {
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeSection, setActiveSection] = useState<'categories' | 'roles' | 'channels'>('categories');
  const [newItem, setNewItem] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple authentication check
    if (adminPassword === 'admin123') { 
        setIsAccessGranted(true);
        setAuthError('');
    } else {
        setAuthError('Incorrect administration password.');
    }
  };

  if (!isAccessGranted) {
    return (
        <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-lg border border-sand-200 text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-sand-100 rounded-full flex items-center justify-center mx-auto mb-4 text-bhumi-600">
                {ICONS.Lock}
            </div>
            <h2 className="text-xl font-bold text-bhumi-900 mb-2">Admin Access Required</h2>
            <p className="text-sand-500 text-sm mb-6">Please enter the master password to modify system configurations.</p>
            
            <form onSubmit={handleUnlock} className="space-y-4">
                <input 
                    type="password" 
                    autoFocus
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    className="w-full border border-sand-300 rounded-lg px-4 py-3 text-center tracking-widest focus:ring-2 focus:ring-bhumi-500 outline-none"
                    placeholder="••••••••"
                />
                {authError && <p className="text-red-500 text-xs font-medium">{authError}</p>}
                
                <button 
                    type="submit" 
                    className="w-full bg-bhumi-600 text-white py-2.5 rounded-lg hover:bg-bhumi-700 font-medium transition-colors shadow-sm"
                >
                    Unlock Settings
                </button>
            </form>
        </div>
    );
  }

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    const updatedList = [...config[activeSection], newItem.trim()];
    onUpdateConfig({
      ...config,
      [activeSection]: updatedList
    });
    setNewItem('');
  };

  const handleDeleteItem = (itemToDelete: string) => {
    if (confirm(`Are you sure you want to remove "${itemToDelete}"?`)) {
        const updatedList = config[activeSection].filter(item => item !== itemToDelete);
        onUpdateConfig({
            ...config,
            [activeSection]: updatedList
        });
    }
  };

  const getSectionTitle = (section: string) => {
      switch(section) {
          case 'categories': return 'Scope / Categories';
          case 'roles': return 'User Roles';
          case 'channels': return 'Marketing Channels';
          default: return section;
      }
  };

  const getSectionDescription = (section: string) => {
    switch(section) {
        case 'categories': return 'Define the scopes or locations for initiatives (e.g. "Company Wide", "Bangsar").';
        case 'roles': return 'Manage the available job titles for team members.';
        case 'channels': return 'Configure the marketing channels or mediums available for campaigns.';
        default: return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-bhumi-900 flex items-center gap-2">
                {ICONS.Settings} Admin Settings
            </h2>
            <p className="text-sand-500">Manage global dropdown lists and application configurations.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 space-y-2">
                {(['categories', 'roles', 'channels'] as const).map(section => (
                    <button
                        key={section}
                        onClick={() => setActiveSection(section)}
                        className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                            activeSection === section 
                            ? 'bg-bhumi-900 text-white shadow-md' 
                            : 'bg-white text-sand-600 hover:bg-sand-50 border border-transparent hover:border-sand-200'
                        }`}
                    >
                        {getSectionTitle(section)}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-white rounded-xl border border-sand-200 shadow-sm p-6 min-h-[400px]">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-bhumi-900 mb-1">{getSectionTitle(activeSection)}</h3>
                    <p className="text-sm text-sand-500">{getSectionDescription(activeSection)}</p>
                </div>

                {/* Add New Item */}
                <div className="flex gap-2 mb-6 p-4 bg-sand-50 rounded-xl border border-sand-100">
                    <input 
                        type="text" 
                        value={newItem}
                        onChange={e => setNewItem(e.target.value)}
                        placeholder={`Add new ${activeSection === 'categories' ? 'category' : activeSection.slice(0, -1)}...`}
                        className="flex-1 border border-sand-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-bhumi-500 outline-none text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    />
                    <button 
                        onClick={handleAddItem}
                        disabled={!newItem.trim()}
                        className="bg-bhumi-600 text-white px-4 py-2 rounded-lg hover:bg-bhumi-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm transition-colors"
                    >
                        Add
                    </button>
                </div>

                {/* List Items */}
                <div className="space-y-2">
                    {config[activeSection].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 hover:bg-sand-50 rounded-lg border border-transparent hover:border-sand-200 group transition-all">
                            <span className="text-bhumi-900 font-medium">{item}</span>
                            <button 
                                onClick={() => handleDeleteItem(item)}
                                className="text-sand-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white rounded-full"
                                title="Remove item"
                            >
                                {ICONS.Delete}
                            </button>
                        </div>
                    ))}
                    {config[activeSection].length === 0 && (
                        <div className="text-center py-8 text-sand-400 italic">
                            No items found. Add one above.
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminSettings;