import React, { useState, useRef, useEffect } from 'react';
import { Campaign, Idea, CampaignAsset, IdeaStatus, CampaignNote, ContentDraft, Comment, User } from '../types';
import { ICONS } from '../constants';

interface CampaignDetailProps {
  campaign: Campaign;
  onBack: () => void;
  onUpdate: (updatedCampaign: Campaign) => void;
  ideas: Idea[];
  onOpenIdeaModal: () => void;
  onUpdateIdea: (idea: Idea) => void;
  channels: string[];
  currentUser: User;
}

// Utility to resize and convert image to Base64
const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!file.type.startsWith('image')) {
                // Non-images (PDF, etc) - just return base64
                resolve(event.target?.result as string);
                return;
            }
            
            // For images, resize to prevent Firestore size limits
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                let width = img.width;
                let height = img.height;
                
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8)); // Compress quality 0.8
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

const CampaignDetail: React.FC<CampaignDetailProps> = ({ 
  campaign, 
  onBack, 
  onUpdate,
  ideas,
  onOpenIdeaModal,
  onUpdateIdea,
  channels,
  currentUser
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'content' | 'pipeline' | 'assets'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedCampaign, setEditedCampaign] = useState(campaign);
  const [newNote, setNewNote] = useState('');
  const [showLinker, setShowLinker] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Update local state if the campaign prop changes (e.g. ID swap after creation)
  useEffect(() => {
    setEditedCampaign(campaign);
  }, [campaign]);

  // Draft State
  const [showDraftForm, setShowDraftForm] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [newDraft, setNewDraft] = useState<Partial<ContentDraft>>({
      platform: 'Instagram',
      caption: '',
      status: 'Draft',
      mediaUrl: ''
  });
  const [draftMediaFile, setDraftMediaFile] = useState<File | null>(null);
  const [newComment, setNewComment] = useState<{[key: string]: string}>({}); // Map draftId to comment text

  const linkedIdeas = ideas.filter(i => i.campaignId === campaign.id);
  
  // Find ideas that are not linked to any campaign
  const unlinkedIdeas = ideas.filter(i => 
    !i.campaignId && 
    (i.title.toLowerCase().includes(linkSearch.toLowerCase()) || 
     i.tags.some(t => t.toLowerCase().includes(linkSearch.toLowerCase())))
  );

  const handleSave = () => {
    onUpdate(editedCampaign);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedCampaign(campaign);
    setIsEditing(false);
  };

  const handleStatusChange = (newStatus: string) => {
      // Update immediately
      const updated = { ...campaign, status: newStatus as any };
      onUpdate(updated);
      setEditedCampaign({ ...editedCampaign, status: newStatus as any });
  };

  const handleLinkIdea = (idea: Idea) => {
    onUpdateIdea({ ...idea, campaignId: campaign.id });
    setShowLinker(false);
    setLinkSearch('');
  };

  const handleUnlinkIdea = (e: React.MouseEvent, idea: Idea) => {
    e.stopPropagation();
    if(window.confirm(`Unlink "${idea.title}" from this initiative?`)) {
        onUpdateIdea({ ...idea, campaignId: undefined });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
          const base64Url = await convertFileToBase64(file);
          const newAsset: CampaignAsset = {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'file',
            url: base64Url
          };
          
          onUpdate({
            ...campaign,
            assets: [...campaign.assets, newAsset]
          });
      } catch (err) {
          console.error("Failed to process file", err);
          alert("Failed to upload image. Please try a smaller file.");
      }
    }
  };

  const handleDeleteAsset = (assetId: string) => {
      if(window.confirm("Remove this asset?")) {
          onUpdate({
              ...campaign,
              assets: campaign.assets.filter(a => a.id !== assetId)
          })
      }
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: CampaignNote = {
      id: Math.random().toString(36).substr(2, 9),
      text: newNote,
      createdAt: new Date(),
      author: currentUser.name
    };
    
    // Update both local edit state and persist changes immediately for notes
    const updatedNotes = [...(campaign.notes || []), note];
    setEditedCampaign({ ...editedCampaign, notes: updatedNotes });
    onUpdate({ ...campaign, notes: updatedNotes });
    setNewNote('');
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = campaign.notes.filter(n => n.id !== noteId);
    setEditedCampaign({ ...editedCampaign, notes: updatedNotes });
    onUpdate({ ...campaign, notes: updatedNotes });
  };

  // --- Draft Logic ---
  const handleDraftMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setDraftMediaFile(file);
          try {
              const base64Url = await convertFileToBase64(file);
              setNewDraft({
                  ...newDraft,
                  mediaUrl: base64Url
              });
          } catch (err) {
              console.error(err);
              alert("Failed to process image.");
          }
      }
  };

  const handleEditDraft = (draft: ContentDraft) => {
      setNewDraft({
          platform: draft.platform,
          caption: draft.caption,
          status: draft.status,
          mediaUrl: draft.mediaUrl
      });
      setEditingDraftId(draft.id);
      setShowDraftForm(true);
  };

  const handleCloseDraftModal = () => {
      setShowDraftForm(false);
      setEditingDraftId(null);
      setNewDraft({ platform: 'Instagram', caption: '', status: 'Draft', mediaUrl: '' });
      setDraftMediaFile(null);
  };

  const handleSaveDraft = () => {
      if (!newDraft.caption) return;
      
      if (editingDraftId) {
          // Update existing
          const updatedDrafts = (campaign.contentDrafts || []).map(d => {
              if (d.id === editingDraftId) {
                  return {
                      ...d,
                      platform: newDraft.platform as any,
                      caption: newDraft.caption || '',
                      mediaUrl: newDraft.mediaUrl,
                      lastUpdated: new Date()
                  };
              }
              return d;
          });
          onUpdate({ ...campaign, contentDrafts: updatedDrafts });
      } else {
          // Create new
          const draft: ContentDraft = {
              id: Math.random().toString(36).substr(2, 9),
              platform: newDraft.platform as any || 'Instagram',
              caption: newDraft.caption || '',
              mediaUrl: newDraft.mediaUrl,
              status: 'Draft',
              author: currentUser.name,
              lastUpdated: new Date(),
              feedback: []
          };
          const updatedDrafts = [...(campaign.contentDrafts || []), draft];
          onUpdate({ ...campaign, contentDrafts: updatedDrafts });
      }
      
      handleCloseDraftModal();
  };

  const updateDraftStatus = (draftId: string, status: ContentDraft['status']) => {
      const updatedDrafts = (campaign.contentDrafts || []).map(d => 
          d.id === draftId ? { ...d, status, lastUpdated: new Date() } : d
      );
      onUpdate({ ...campaign, contentDrafts: updatedDrafts });
  };

  const handleDeleteDraft = (draftId: string) => {
      if(confirm('Delete this draft post?')) {
        const updatedDrafts = (campaign.contentDrafts || []).filter(d => d.id !== draftId);
        onUpdate({ ...campaign, contentDrafts: updatedDrafts });
      }
  }

  const handleAddDraftComment = (draftId: string) => {
      const text = newComment[draftId];
      if (!text?.trim()) return;

      const updatedDrafts = (campaign.contentDrafts || []).map(d => {
          if (d.id === draftId) {
              return {
                  ...d,
                  feedback: [
                      ...d.feedback,
                      {
                          id: Math.random().toString(36).substr(2, 9),
                          author: currentUser.name,
                          text: text,
                          timestamp: new Date()
                      }
                  ]
              };
          }
          return d;
      });
      onUpdate({ ...campaign, contentDrafts: updatedDrafts });
      setNewComment({ ...newComment, [draftId]: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-sand-200 rounded-full text-sand-500 transition-colors"
          >
            {ICONS.Back}
          </button>
          <div className="flex-1 max-w-3xl">
            <div className="flex items-center gap-3 mb-1">
                 {isEditing ? (
                    <input 
                        value={editedCampaign.name}
                        onChange={e => setEditedCampaign({...editedCampaign, name: e.target.value})}
                        className="text-2xl font-bold text-bhumi-900 bg-white border border-sand-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-bhumi-500 focus:border-bhumi-500 outline-none w-full shadow-inner"
                        placeholder="Initiative Name"
                    />
                 ) : (
                    <h1 className="text-2xl font-bold text-bhumi-900 px-3 py-1 border border-transparent">{campaign.name}</h1>
                 )}
                 
                 {/* Always Visible Status Dropdown */}
                 <div className="relative group">
                     <select
                        value={campaign.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-bold uppercase tracking-wider outline-none cursor-pointer appearance-none pr-8 hover:opacity-80 transition-opacity ${
                            campaign.status === 'Active' ? 'bg-bhumi-100 text-bhumi-700 border-bhumi-200' : 
                            campaign.status === 'Archived' ? 'bg-sand-200 text-sand-500 border-sand-300' :
                            'bg-sand-100 text-sand-700 border-sand-200'
                        }`}
                        style={{backgroundImage: 'none'}} // Remove default arrow
                    >
                        <option value="Planning">Planning</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Archived">Archived</option>
                    </select>
                    {/* Custom Arrow Indicator */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-50">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                 </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
           {isEditing ? (
               <div className="flex items-center bg-white border border-sand-300 rounded-lg p-1 shadow-sm animate-fade-in">
                   <button onClick={handleCancel} className="px-4 py-1.5 text-sand-600 hover:bg-sand-100 rounded-md text-sm font-medium transition-colors">
                       Cancel
                   </button>
                   <div className="w-px h-4 bg-sand-200 mx-1"></div>
                   <button onClick={handleSave} className="flex items-center gap-1.5 bg-bhumi-600 text-white px-4 py-1.5 rounded-md hover:bg-bhumi-700 text-sm font-medium shadow-sm transition-colors">
                       {ICONS.Save} Save
                   </button>
               </div>
           ) : (
               <button onClick={() => { setIsEditing(true); setEditedCampaign(campaign); }} className="flex items-center gap-2 bg-white border border-sand-200 text-sand-700 px-4 py-2 rounded-lg hover:bg-sand-50 hover:border-sand-300 hover:text-bhumi-700 transition-all shadow-sm text-sm font-medium">
                   {ICONS.Edit} Edit Details
               </button>
           )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-sand-200">
        {['overview', 'content', 'pipeline', 'assets'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSection(tab as any)}
            className={`px-6 py-3 font-medium text-sm transition-all relative ${
              activeSection === tab 
                ? 'text-bhumi-700' 
                : 'text-sand-500 hover:text-sand-700'
            }`}
          >
            {tab === 'content' ? 'Content Drafts' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeSection === tab && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-bhumi-500 rounded-t-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        
        {/* OVERVIEW TAB */}
        {activeSection === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="md:col-span-2 space-y-6">
                <div className={`bg-white p-6 rounded-xl border transition-colors shadow-sm ${isEditing ? 'border-bhumi-200 shadow-md ring-1 ring-bhumi-100' : 'border-sand-200'}`}>
                    <h3 className="font-bold text-bhumi-900 mb-4 text-sm uppercase tracking-wider">Description</h3>
                    {isEditing ? (
                        <textarea 
                            value={editedCampaign.description || ''}
                            onChange={e => setEditedCampaign({...editedCampaign, description: e.target.value})}
                            className="w-full min-h-[160px] border border-sand-300 rounded-lg p-4 focus:ring-2 focus:ring-bhumi-500 outline-none text-sand-800 leading-relaxed shadow-inner"
                            placeholder="Enter initiative description..."
                        />
                    ) : (
                        <div className="text-sand-700 leading-relaxed min-h-[40px] whitespace-pre-wrap">
                            {campaign.description || <span className="text-sand-400 italic">No description provided.</span>}
                        </div>
                    )}
                </div>

                {/* Notes Section */}
                <div className="bg-white p-6 rounded-xl border border-sand-200 shadow-sm flex flex-col">
                    <h3 className="font-bold text-bhumi-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                        {ICONS.File} Notes & Updates
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[400px] pr-1">
                        {campaign.notes && campaign.notes.length > 0 ? (
                            campaign.notes.map(note => (
                                <div key={note.id} className="bg-sand-50 p-4 rounded-xl border border-sand-100 relative group transition-all hover:bg-sand-100/80">
                                     <p className="text-sand-800 text-sm whitespace-pre-wrap leading-relaxed">{note.text}</p>
                                     <div className="flex justify-between items-center mt-3 pt-3 border-t border-sand-200/50 text-xs text-sand-400">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-sand-200 flex items-center justify-center text-[10px] font-bold text-sand-600">
                                                {note.author.charAt(0)}
                                            </div>
                                            <span>{note.author} • {new Date(note.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteNote(note.id)} 
                                            className="opacity-0 group-hover:opacity-100 text-sand-400 hover:text-red-500 transition-all p-1"
                                            title="Delete note"
                                        >
                                            {ICONS.Delete}
                                        </button>
                                     </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-sand-400 text-sm py-8 italic border-2 border-dashed border-sand-100 rounded-xl bg-sand-50/30">
                                No raw ideas logged yet. <br/>Start the conversation below.
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 items-start pt-2 border-t border-sand-100">
                        <textarea
                            value={newNote}
                            onChange={e => setNewNote(e.target.value)}
                            placeholder="Add a new note, idea, or reminder..."
                            className="flex-1 border border-sand-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-bhumi-500 outline-none resize-none h-12 focus:h-24 transition-all bg-sand-50 focus:bg-white"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddNote();
                                }
                            }}
                        />
                        <button 
                            onClick={handleAddNote}
                            disabled={!newNote.trim()}
                            className="bg-bhumi-600 text-white p-3 rounded-lg hover:bg-bhumi-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                        >
                            {ICONS.Add}
                        </button>
                    </div>
                </div>
            </div>

            {/* Sidebar Details (Editable) */}
            <div className="space-y-6">
                <div className={`bg-white p-6 rounded-xl border transition-colors shadow-sm ${isEditing ? 'border-bhumi-200 shadow-md ring-1 ring-bhumi-100' : 'border-sand-200'}`}>
                    <h3 className="font-bold text-bhumi-900 mb-6 text-sm uppercase tracking-wider">Parameters</h3>
                    <div className="space-y-6">
                         {/* Channel */}
                        <div className="space-y-1.5">
                            <label className="text-sand-500 text-xs font-semibold">CHANNEL / MEDIUM</label>
                            {isEditing ? (
                                <select
                                    value={editedCampaign.channel}
                                    onChange={e => setEditedCampaign({...editedCampaign, channel: e.target.value})}
                                    className="w-full border border-sand-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-bhumi-500 outline-none shadow-sm"
                                >
                                    {channels.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                    {/* Fallback if current value is not in list */}
                                    {!channels.includes(editedCampaign.channel) && (
                                        <option value={editedCampaign.channel}>{editedCampaign.channel}</option>
                                    )}
                                </select>
                            ) : (
                                <div className="text-bhumi-900 font-medium text-sm bg-sand-50/50 px-3 py-2 rounded-lg border border-transparent">
                                    {campaign.channel}
                                </div>
                            )}
                        </div>

                        {/* Start Date */}
                        <div className="space-y-1.5">
                            <label className="text-sand-500 text-xs font-semibold">START DATE</label>
                            {isEditing ? (
                                <input 
                                    type="date"
                                    value={editedCampaign.startDate}
                                    onChange={e => setEditedCampaign({...editedCampaign, startDate: e.target.value})}
                                    className="w-full border border-sand-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-bhumi-500 outline-none shadow-sm"
                                />
                            ) : (
                                <div className="text-bhumi-900 font-medium text-sm bg-sand-50/50 px-3 py-2 rounded-lg border border-transparent">
                                    {new Date(campaign.startDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                </div>
                            )}
                        </div>

                         {/* End Date */}
                        <div className="space-y-1.5">
                            <label className="text-sand-500 text-xs font-semibold">END DATE</label>
                            {isEditing ? (
                                <input 
                                    type="date"
                                    value={editedCampaign.endDate}
                                    onChange={e => setEditedCampaign({...editedCampaign, endDate: e.target.value})}
                                    className="w-full border border-sand-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-bhumi-500 outline-none shadow-sm"
                                />
                            ) : (
                                <div className="text-bhumi-900 font-medium text-sm bg-sand-50/50 px-3 py-2 rounded-lg border border-transparent">
                                    {new Date(campaign.endDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* CONTENT DRAFTS TAB (NEW) */}
        {activeSection === 'content' && (
            <div className="space-y-6">
                {/* Action Bar */}
                <div className="flex justify-between items-center bg-sand-50 p-4 rounded-xl border border-sand-200">
                    <div>
                        <h3 className="font-bold text-bhumi-900">Social & Content Drafts</h3>
                        <p className="text-sand-500 text-sm">Review, approve, and schedule content specific to this initiative.</p>
                    </div>
                    <button 
                        onClick={() => setShowDraftForm(true)}
                        className="bg-bhumi-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-bhumi-700 flex items-center gap-2 shadow-sm"
                    >
                        {ICONS.Add} New Draft Post
                    </button>
                </div>

                {/* Draft Form Modal */}
                {showDraftForm && (
                    <div className="fixed inset-0 bg-bhumi-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-sand-200">
                             <div className="p-6 border-b border-sand-200 flex justify-between items-center bg-sand-50">
                                <h3 className="font-bold text-bhumi-900">
                                    {editingDraftId ? 'Edit Content Draft' : 'Create Content Draft'}
                                </h3>
                                <button onClick={handleCloseDraftModal} className="text-sand-400 hover:text-stone-600">{ICONS.Close}</button>
                             </div>
                             <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-sand-700 mb-1">Platform</label>
                                    <select 
                                        value={newDraft.platform}
                                        onChange={e => setNewDraft({...newDraft, platform: e.target.value as any})}
                                        className="w-full border border-sand-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-bhumi-500 outline-none"
                                    >
                                        <option value="Instagram">Instagram</option>
                                        <option value="TikTok">TikTok</option>
                                        <option value="XHS">XHS</option>
                                        <option value="Threads">Threads</option>
                                        <option value="LinkedIn">LinkedIn</option>
                                        <option value="Website Content">Website Content</option>
                                        <option value="Email">Email</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-sand-700 mb-1">Caption / Copy</label>
                                    <textarea 
                                        rows={6}
                                        value={newDraft.caption}
                                        onChange={e => setNewDraft({...newDraft, caption: e.target.value})}
                                        className="w-full border border-sand-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-bhumi-500 outline-none resize-none"
                                        placeholder="Write your post caption and hashtags here..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-sand-700 mb-1">Visual Mockup (Optional)</label>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={handleDraftMediaUpload}
                                            className="block w-full text-sm text-sand-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-bhumi-50 file:text-bhumi-700 hover:file:bg-bhumi-100"
                                        />
                                    </div>
                                    {newDraft.mediaUrl && (
                                        <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden border border-sand-200">
                                            <img src="/bhumi-logo.png" alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                                <div className="pt-4 flex justify-end gap-2">
                                    <button onClick={handleCloseDraftModal} className="px-4 py-2 text-sand-600 hover:bg-sand-100 rounded-lg text-sm">Cancel</button>
                                    <button onClick={handleSaveDraft} className="px-4 py-2 bg-bhumi-600 text-white rounded-lg hover:bg-bhumi-700 text-sm font-medium">
                                        {editingDraftId ? 'Update Draft' : 'Save Draft'}
                                    </button>
                                </div>
                             </div>
                        </div>
                    </div>
                )}

                {/* Drafts Grid */}
                {campaign.contentDrafts && campaign.contentDrafts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaign.contentDrafts.map(draft => (
                            <div key={draft.id} className="bg-white rounded-2xl border border-sand-200 overflow-hidden shadow-sm flex flex-col">
                                {/* Status Header */}
                                <div className={`px-4 py-2 border-b border-sand-100 flex justify-between items-center ${
                                    draft.status === 'Approved' ? 'bg-green-50' : 
                                    draft.status === 'In Review' ? 'bg-yellow-50' : 
                                    draft.status === 'Changes Requested' ? 'bg-red-50' : 'bg-sand-50'
                                }`}>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${
                                        draft.status === 'Approved' ? 'text-green-700' : 
                                        draft.status === 'In Review' ? 'text-yellow-700' : 
                                        draft.status === 'Changes Requested' ? 'text-red-700' : 'text-sand-600'
                                    }`}>
                                        {draft.status}
                                    </span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditDraft(draft)} className="text-sand-400 hover:text-bhumi-600">
                                            {ICONS.Edit}
                                        </button>
                                        <button onClick={() => handleDeleteDraft(draft.id)} className="text-sand-400 hover:text-red-500">
                                            {ICONS.Delete}
                                        </button>
                                    </div>
                                </div>

                                {/* Mockup View */}
                                <div className="p-4 flex-1">
                                    {/* Phone Header Mock */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-sand-50 flex items-center justify-center border border-sand-200">
                                            <img src="/bhumi-logo.png" alt="Profile" className="w-5 h-5 object-contain opacity-80" />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-xs font-bold text-bhumi-900">bhumi_lifestyle</span>
                                        </div>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="space-y-3">
                                        {draft.mediaUrl ? (
                                            <div className="aspect-square bg-sand-100 rounded-lg overflow-hidden border border-sand-100">
                                                <img src={draft.mediaUrl} alt="Post content" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="aspect-video bg-sand-100 rounded-lg flex items-center justify-center text-sand-400 border border-sand-100 border-dashed">
                                                <span className="text-xs">No media attached</span>
                                            </div>
                                        )}
                                        <p className="text-sm text-sand-800 whitespace-pre-wrap leading-relaxed">{draft.caption}</p>
                                        <div className="text-xs text-blue-600 font-medium">
                                            {draft.caption.match(/#[a-z0-9_]+/gi)?.join(' ')}
                                        </div>
                                    </div>
                                </div>

                                {/* Feedback & Actions */}
                                <div className="bg-sand-50/50 border-t border-sand-200 p-4 space-y-3">
                                    {/* Approval Actions */}
                                    <div className="flex gap-2">
                                        {draft.status !== 'Approved' && (
                                            <button 
                                                onClick={() => updateDraftStatus(draft.id, 'Approved')}
                                                className="flex-1 bg-white border border-green-200 text-green-700 py-1.5 rounded hover:bg-green-50 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                            >
                                                {ICONS.ThumbsUp} Approve
                                            </button>
                                        )}
                                        {draft.status === 'Draft' && (
                                            <button 
                                                onClick={() => updateDraftStatus(draft.id, 'In Review')}
                                                className="flex-1 bg-white border border-yellow-200 text-yellow-700 py-1.5 rounded hover:bg-yellow-50 text-xs font-bold transition-colors"
                                            >
                                                Submit for Review
                                            </button>
                                        )}
                                        {draft.status === 'In Review' && (
                                             <button 
                                                onClick={() => updateDraftStatus(draft.id, 'Changes Requested')}
                                                className="flex-1 bg-white border border-red-200 text-red-700 py-1.5 rounded hover:bg-red-50 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                            >
                                                {ICONS.ThumbsDown} Request Changes
                                            </button>
                                        )}
                                    </div>

                                    {/* Comments Section */}
                                    {draft.feedback.length > 0 && (
                                        <div className="space-y-2 pt-2 border-t border-sand-200/50">
                                            {draft.feedback.map(comment => (
                                                <div key={comment.id} className="text-xs bg-white p-2 rounded border border-sand-100">
                                                    <span className="font-bold text-bhumi-900 mr-1">{comment.author}:</span>
                                                    <span className="text-sand-600">{comment.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add Comment Input */}
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={newComment[draft.id] || ''}
                                            onChange={(e) => setNewComment({...newComment, [draft.id]: e.target.value})}
                                            placeholder="Add feedback..."
                                            className="flex-1 text-xs border border-sand-300 rounded px-2 py-1 focus:ring-1 focus:ring-bhumi-500 outline-none"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddDraftComment(draft.id)}
                                        />
                                        <button 
                                            onClick={() => handleAddDraftComment(draft.id)}
                                            className="text-bhumi-600 hover:text-bhumi-800"
                                        >
                                            {ICONS.Send}
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-sand-400 pt-1">
                                        <span>{draft.platform} • Author: {draft.author}</span>
                                        <span>{new Date(draft.lastUpdated).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-sand-300">
                        <div className="text-sand-300 mb-2">{ICONS.Smartphone}</div>
                        <p className="text-sand-500 mb-4">No content drafts created yet.</p>
                        <button onClick={() => setShowDraftForm(true)} className="text-bhumi-600 font-medium text-sm hover:underline">
                            Create your first draft
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* ASSETS TAB */}
        {activeSection === 'assets' && (
            <div className="space-y-4">
                 <div className="flex justify-between items-center bg-sand-50 p-4 rounded-xl border border-sand-200">
                    <div>
                        <h3 className="font-bold text-bhumi-900">Promotional Assets</h3>
                        <p className="text-sand-500 text-sm">Photos, videos, and creative briefs.</p>
                    </div>
                    <div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleFileUpload}
                            accept="image/*,video/*,application/pdf" 
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            className="bg-white border border-sand-300 text-sand-700 px-4 py-2 rounded-lg text-sm hover:bg-sand-50 flex items-center gap-2"
                        >
                            {ICONS.Upload} Upload File
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {campaign.assets.map(asset => (
                        <div key={asset.id} className="group relative bg-white rounded-xl border border-sand-200 overflow-hidden aspect-square flex flex-col">
                            <div className="flex-1 bg-stone-100 flex items-center justify-center overflow-hidden relative">
                                {asset.type === 'image' ? (
                                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                                ) : asset.type === 'video' ? (
                                    <div className="text-stone-400 flex flex-col items-center">
                                        {ICONS.Video}
                                        <span className="text-xs mt-1">Video</span>
                                    </div>
                                ) : (
                                    <div className="text-stone-400 flex flex-col items-center">
                                        {ICONS.File}
                                        <span className="text-xs mt-1">File</span>
                                    </div>
                                )}
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={() => handleDeleteAsset(asset.id)} className="bg-white p-2 rounded-full text-red-500 hover:text-red-600">
                                        {ICONS.Delete}
                                    </button>
                                </div>
                            </div>
                            <div className="p-2 text-xs font-medium text-stone-700 truncate border-t border-sand-100">
                                {asset.name}
                            </div>
                        </div>
                    ))}
                    <button 
                         onClick={() => fileInputRef.current?.click()} 
                         className="border-2 border-dashed border-sand-200 rounded-xl flex flex-col items-center justify-center text-sand-400 hover:border-bhumi-400 hover:text-bhumi-600 transition-all aspect-square"
                    >
                        {ICONS.Add}
                        <span className="text-xs font-medium mt-1">Add Asset</span>
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default CampaignDetail;
