import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import IdeaPipeline from './components/IdeaPipeline';
import CampaignsList from './components/CampaignsList';
import CampaignDetail from './components/CampaignDetail';
import IdeaModal from './components/IdeaModal';
import UserManagement from './components/UserManagement';
import AdminSettings from './components/AdminSettings';
import MarketIntelligence from './components/MarketIntelligence';
import Login from './components/Login';
import { ICONS } from './constants';
import { Idea, Campaign, User, AppConfig } from './types';
import { db } from './services/db';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true); // Initial session check
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data State
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<AppConfig>({ categories: [], roles: [], channels: [] });
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [modalCampaignId, setModalCampaignId] = useState<string | undefined>(undefined);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  
  // Notification System
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [hasPermissionError, setHasPermissionError] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 4000);
  };

  // 1. Initial Session Check on Mount
  useEffect(() => {
    const checkSession = () => {
        try {
            const sessionUser = db.getSession();
            if (sessionUser) setUser(sessionUser);
        } catch (error) {
            console.error("Session check failed", error);
        } finally {
            setLoading(false);
        }
    };
    checkSession();
  }, []);

  // 2. Load Data ONLY when User exists
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
        try {
            // Seed DB if new (safe to call here as user is authenticated)
            await db.init();

            // Fetch Data
            const [fetchedUsers, fetchedConfig, fetchedIdeas, fetchedCampaigns] = await Promise.all([
                db.getUsers(),
                db.getConfig(),
                db.getIdeas(),
                db.getCampaigns()
            ]);

            setUsers(fetchedUsers);
            setConfig(fetchedConfig);
            setIdeas(fetchedIdeas);
            setCampaigns(fetchedCampaigns);
        } catch (error) {
            console.error("Data load failed:", error);
            showToast("Failed to load data. Check connection.", 'error');
        }
    };

    loadData();
  }, [user]);

  const handleLogin = (loggedInUser: User) => {
      setUser(loggedInUser);
  };

  const handleLogout = async () => {
      await db.logout();
      setUser(null);
      setIdeas([]);
      setCampaigns([]);
      setHasPermissionError(false);
  };

  const handleUpdateConfig = async (newConfig: AppConfig) => {
      const prevConfig = config;
      setConfig(newConfig);
      try {
          await db.saveConfig(newConfig);
          showToast("Settings updated");
      } catch (error: any) {
          setConfig(prevConfig);
          handleError(error, "Failed to update settings");
      }
  }

  const handleOpenModal = (campaignId?: string) => {
    setModalCampaignId(campaignId);
    setEditingIdea(null);
    setIsModalOpen(true);
  };

  const handleEditIdea = (idea: Idea) => {
    setEditingIdea(idea);
    setModalCampaignId(undefined);
    setIsModalOpen(true);
  };

  const handleError = (error: any, defaultMsg: string) => {
      console.error(error);
      const msg = error?.message || '';
      const code = error?.code || '';
      
      if (code === 'permission-denied' || msg.includes('Missing or insufficient permissions')) {
          setHasPermissionError(true);
          showToast("Permission Denied: Unable to save to database.", 'error');
      } else {
          showToast(defaultMsg, 'error');
      }
  };

  const handleAddIdea = async (newIdea: Partial<Idea>) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    const idea: Idea = {
      ...newIdea as Idea,
      id: tempId,
      createdAt: new Date(),
      comments: [],
      tags: newIdea.tags || [],
      status: newIdea.status || 'New' as any,
      priority: newIdea.priority || 'Medium' as any,
      category: newIdea.category || config.categories[0] || 'General',
      author: user?.name || 'Unknown'
    };
    
    // Optimistic Update
    const prevIdeas = [...ideas];
    setIdeas([idea, ...ideas]);

    try {
        const savedIdea = await db.saveIdea(idea);
        // Swap temp ID with real DB ID
        setIdeas(prev => prev.map(i => i.id === tempId ? savedIdea : i));
        showToast("Idea created successfully");
    } catch (error) {
        setIdeas(prevIdeas); // Rollback
        handleError(error, "Failed to create idea");
    }
  };

  const handleUpdateIdea = async (updatedIdea: Idea) => {
    // Optimistic Update
    const prevIdeas = [...ideas];
    setIdeas(prev => prev.map(i => i.id === updatedIdea.id ? updatedIdea : i));
    
    try {
        await db.updateIdea(updatedIdea);
        // Do not toast for every drag/drop update to reduce noise
        if (updatedIdea.status !== prevIdeas.find(i => i.id === updatedIdea.id)?.status) {
             // Only toast on significant status changes if desired, or silent
        } else {
             showToast("Idea updated");
        }
    } catch (error) {
        setIdeas(prevIdeas); // Rollback
        handleError(error, "Failed to update idea");
    }
  };

  const handleDeleteIdea = async (id: string) => {
      const prevIdeas = [...ideas];
      setIdeas(prev => prev.filter(i => i.id !== id));
      
      try {
          await db.deleteIdea(id);
          showToast("Idea deleted");
      } catch (error) {
          setIdeas(prevIdeas);
          handleError(error, "Failed to delete idea");
      }
  }

  const handleSaveIdea = (ideaData: Partial<Idea>) => {
    if (editingIdea) {
      handleUpdateIdea({ ...editingIdea, ...ideaData } as Idea);
    } else {
      handleAddIdea(ideaData);
    }
    setIsModalOpen(false);
    setEditingIdea(null);
  };

  const handleSelectCampaign = (id: string) => {
    setSelectedCampaignId(id);
    setActiveTab('campaigns'); 
  };

  const handleAddCampaign = async () => {
    const tempId = Math.random().toString(36).substr(2, 9);
    const newCampaign: Campaign = {
      id: tempId,
      name: 'New Initiative',
      description: 'Describe your new initiative here...',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Planning',
      channel: config.channels[0] || 'TBD',
      linkedCampaignIds: [],
      assets: [],
      notes: [],
      contentDrafts: []
    };
    
    const prevCampaigns = [...campaigns];
    setCampaigns([newCampaign, ...campaigns]);
    setSelectedCampaignId(tempId);

    try {
        const savedCampaign = await db.saveCampaign(newCampaign);
        
        // Swap temp ID with real DB ID in list
        setCampaigns(prev => prev.map(c => c.id === tempId ? savedCampaign : c));
        
        // Update selection if user is still viewing it
        setSelectedCampaignId(curr => curr === tempId ? savedCampaign.id : curr);
        
        showToast("New initiative created");
    } catch (error) {
        setCampaigns(prevCampaigns); // Rollback
        setSelectedCampaignId(null);
        handleError(error, "Failed to create initiative");
    }
  };

  const handleUpdateCampaign = async (updatedCampaign: Campaign) => {
    const prevCampaigns = [...campaigns];
    setCampaigns(prev => prev.map(c => c.id === updatedCampaign.id ? updatedCampaign : c));
    
    try {
        await db.updateCampaign(updatedCampaign);
    } catch (error) {
        setCampaigns(prevCampaigns);
        handleError(error, "Failed to save changes");
    }
  };

  const handleAddUser = async (newUser: User) => {
      try {
          const updated = await db.addUser(newUser);
          setUsers(updated);
          showToast("Team member added");
      } catch (error) {
          handleError(error, "Failed to add user");
      }
  }

  const handleUpdateUserStatus = async (id: string, status: 'Active' | 'Inactive') => {
      try {
          const updated = await db.updateUserStatus(id, status);
          setUsers(updated);
          showToast(`User ${status.toLowerCase()}`);
      } catch (error) {
          handleError(error, "Failed to update user status");
      }
  }

  const handleResetPassword = async (id: string) => {
      try {
          const updated = await db.resetUserPassword(id);
          setUsers(updated);
          showToast("Password reset to 'welcome123'");
      } catch (error) {
          handleError(error, "Failed to reset password");
      }
  }

  const renderContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard ideas={ideas} campaigns={campaigns} />;
      case 'pipeline':
        return <IdeaPipeline 
            ideas={ideas} 
            onAddIdea={() => handleOpenModal()} 
            onEditIdea={handleEditIdea} 
            onUpdateIdea={handleUpdateIdea}
            onDeleteIdea={handleDeleteIdea}
        />;
      case 'campaigns':
        if (selectedCampaignId) {
          const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
          if (selectedCampaign) {
            return (
              <CampaignDetail 
                campaign={selectedCampaign} 
                onBack={() => setSelectedCampaignId(null)}
                onUpdate={handleUpdateCampaign}
                ideas={ideas}
                onOpenIdeaModal={() => handleOpenModal(selectedCampaign.id)}
                onUpdateIdea={handleUpdateIdea}
                channels={config.channels}
              />
            );
          }
        }
        return <CampaignsList 
                  campaigns={campaigns} 
                  onSelectCampaign={handleSelectCampaign} 
                  onCreateCampaign={handleAddCampaign}
                  onUpdateCampaign={handleUpdateCampaign}
               />;
      case 'market-intelligence':
          return <MarketIntelligence />;
      case 'users':
          return <UserManagement 
            currentUser={user}
            users={users} 
            onAddUser={handleAddUser} 
            onUpdateUserStatus={handleUpdateUserStatus} 
            onResetPassword={handleResetPassword}
            roles={config.roles} 
          />;
      case 'admin':
          return <AdminSettings config={config} onUpdateConfig={handleUpdateConfig} />;
      default:
        return <Dashboard ideas={ideas} campaigns={campaigns} />;
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab !== 'campaigns') {
      setSelectedCampaignId(null);
    }
    setActiveTab(tab);
  };

  if (loading) {
      return (
          <div className="min-h-screen bg-sand-100 flex items-center justify-center flex-col gap-4">
              <div className="w-12 h-12 border-4 border-bhumi-200 border-t-bhumi-600 rounded-full animate-spin"></div>
              <p className="text-bhumi-900 font-medium animate-pulse">Loading BhumiHub...</p>
          </div>
      )
  }

  if (!user) {
      return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={handleTabChange} user={user} onLogout={handleLogout}>
        
        {/* Permission Error Banner */}
        {hasPermissionError && (
            <div className="bg-red-50 border-b border-red-200 p-4 animate-fade-in-down">
                <div className="max-w-4xl mx-auto flex items-start gap-4">
                    <div className="bg-red-100 text-red-600 p-2 rounded-full shrink-0 mt-1">
                        {ICONS.Lock}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-red-800 text-sm">Database Write Permission Denied</h3>
                        <p className="text-red-700 text-xs mt-1 mb-3">
                            Your Firestore security rules are blocking the application from saving data. 
                            Please copy the rules below and paste them into <strong>Firebase Console &gt; Firestore Database &gt; Rules</strong>.
                        </p>
                        <div className="bg-white border border-red-200 rounded-lg p-3 relative group">
                            <pre className="text-[10px] text-stone-600 font-mono overflow-x-auto whitespace-pre">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
                            </pre>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if request.auth != null;\n    }\n  }\n}`);
                                    showToast("Rules copied to clipboard");
                                }}
                                className="absolute top-2 right-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs px-2 py-1 rounded border border-red-100 transition-colors font-bold"
                            >
                                Copy Rules
                            </button>
                        </div>
                    </div>
                    <button 
                        onClick={() => setHasPermissionError(false)}
                        className="text-red-400 hover:text-red-600"
                    >
                        {ICONS.Close}
                    </button>
                </div>
            </div>
        )}

        {renderContent()}
      </Layout>
      
      {/* Global Notification Toast */}
      {notification && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-fade-in-up border ${
            notification.type === 'success' ? 'bg-bhumi-900 text-white border-bhumi-800' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
            {notification.type === 'success' ? ICONS.Success : ICONS.Alert}
            <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <IdeaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveIdea}
        defaultCampaignId={modalCampaignId}
        initialIdea={editingIdea}
        categories={config.categories}
      />
    </>
  );
};

export default App;
