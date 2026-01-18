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
        }
    };

    loadData();
  }, [user]);

  const handleLogin = (loggedInUser: User) => {
      setUser(loggedInUser);
      // Data load useEffect will trigger automatically
  };

  const handleLogout = async () => {
      await db.logout();
      setUser(null);
      setIdeas([]);
      setCampaigns([]);
  };

  const handleUpdateConfig = async (newConfig: AppConfig) => {
      setConfig(newConfig);
      await db.saveConfig(newConfig);
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

  const handleAddIdea = async (newIdea: Partial<Idea>) => {
    const idea: Idea = {
      ...newIdea as Idea,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      comments: [],
      tags: newIdea.tags || [],
      status: newIdea.status || 'New' as any,
      priority: newIdea.priority || 'Medium' as any,
      category: newIdea.category || config.categories[0] || 'General',
      author: user?.name || 'Unknown'
    };
    
    // Optimistic Update
    setIdeas([idea, ...ideas]);
    // Persist
    await db.saveIdea(idea);
  };

  const handleUpdateIdea = async (updatedIdea: Idea) => {
    // Optimistic Update
    setIdeas(prev => prev.map(i => i.id === updatedIdea.id ? updatedIdea : i));
    // Persist
    await db.updateIdea(updatedIdea);
  };

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
    const newCampaign: Campaign = {
      id: Math.random().toString(36).substr(2, 9),
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
    
    setCampaigns([newCampaign, ...campaigns]);
    setSelectedCampaignId(newCampaign.id);
    await db.saveCampaign(newCampaign);
  };

  const handleUpdateCampaign = async (updatedCampaign: Campaign) => {
    setCampaigns(prev => prev.map(c => c.id === updatedCampaign.id ? updatedCampaign : c));
    await db.updateCampaign(updatedCampaign);
  };

  const handleAddUser = async (newUser: User) => {
      const updated = await db.addUser(newUser);
      setUsers(updated);
  }

  const handleUpdateUserStatus = async (id: string, status: 'Active' | 'Inactive') => {
      const updated = await db.updateUserStatus(id, status);
      setUsers(updated);
  }

  const handleResetPassword = async (id: string) => {
      const updated = await db.resetUserPassword(id);
      setUsers(updated);
      alert("Password has been reset to 'welcome123'");
  }

  const renderContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard ideas={ideas} campaigns={campaigns} />;
      case 'pipeline':
        const wrappedSetIdeas = (action: React.SetStateAction<Idea[]>) => {
            setIdeas(prev => {
                const next = typeof action === 'function' ? action(prev) : action;
                return next;
            });
        };

        return <IdeaPipeline 
            ideas={ideas} 
            setIdeas={wrappedSetIdeas}
            onAddIdea={() => handleOpenModal()} 
            onEditIdea={handleEditIdea} 
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
        {renderContent()}
      </Layout>
      
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
