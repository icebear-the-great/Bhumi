import React, { useState } from 'react';
import { Idea, IdeaStatus, Priority } from '../types';
import { ICONS } from '../constants';

interface IdeaPipelineProps {
  ideas: Idea[];
  // setIdeas is optional now as we use onUpdateIdea, but keeping it for compatibility if needed elsewhere
  setIdeas?: React.Dispatch<React.SetStateAction<Idea[]>>;
  onAddIdea: () => void;
  onEditIdea: (idea: Idea) => void;
  onUpdateIdea: (idea: Idea) => void;
  onDeleteIdea: (id: string) => void;
}

const IdeaPipeline: React.FC<IdeaPipelineProps> = ({ ideas, onAddIdea, onEditIdea, onUpdateIdea, onDeleteIdea }) => {
  const [filter, setFilter] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Helper to normalize tags (ensure they start with # and are lowercase for comparison)
  const normalizeTag = (tag: string) => (tag.startsWith('#') ? tag : `#${tag}`).toLowerCase();

  // Extract all unique tags normalized
  const allTags = Array.from(new Set(ideas.flatMap(idea => idea.tags.map(normalizeTag)))).sort();

  // Define active statuses vs archived
  const activeStatuses = [IdeaStatus.NEW, IdeaStatus.VALIDATED, IdeaStatus.IN_PROGRESS, IdeaStatus.LIVE];
  
  // Group ideas by status based on view mode
  const columns = showArchived ? [IdeaStatus.CANCELLED] : activeStatuses;

  const COLUMN_DESCRIPTIONS: Record<IdeaStatus, string> = {
    [IdeaStatus.NEW]: 'Raw concepts & brain dumps',
    [IdeaStatus.VALIDATED]: 'Strategically aligned & approved',
    [IdeaStatus.IN_PROGRESS]: 'Creative production underway',
    [IdeaStatus.LIVE]: 'In market & gathering data',
    [IdeaStatus.CANCELLED]: 'Ideas not currently being pursued'
  };
  
  const getIdeasByStatus = (status: IdeaStatus) => {
    return ideas.filter(idea => {
      const matchesSearch = idea.title.toLowerCase().includes(filter.toLowerCase()) || 
                            idea.tags.some(t => t.toLowerCase().includes(filter.toLowerCase()));
      // Filter based on normalized tags
      const matchesTag = selectedTag === '' || idea.tags.some(t => normalizeTag(t) === selectedTag);
      
      return idea.status === status && matchesSearch && matchesTag;
    });
  };

  const handleDelete = (id: string) => {
      if(window.confirm("Are you sure you want to permanently delete this idea?")) {
        onDeleteIdea(id);
      }
  };

  const handleStatusChange = (idea: Idea, newStatus: IdeaStatus) => {
    onUpdateIdea({ ...idea, status: newStatus });
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.CRITICAL: return 'bg-terra-100 text-terra-700 border-terra-200';
      case Priority.HIGH: return 'bg-orange-100 text-orange-700 border-orange-200';
      case Priority.MEDIUM: return 'bg-sand-100 text-sand-700 border-sand-200';
      default: return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  // Helper for status bar styling
  const getStatusColor = (status: IdeaStatus, isActive: boolean) => {
    if (!isActive) return 'bg-sand-50 text-sand-400 hover:bg-sand-100 hover:text-sand-600';
    switch (status) {
        case IdeaStatus.NEW: return 'bg-bhumi-100 text-bhumi-700 border border-bhumi-200 shadow-sm';
        case IdeaStatus.VALIDATED: return 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm';
        case IdeaStatus.IN_PROGRESS: return 'bg-terra-100 text-terra-700 border border-terra-200 shadow-sm';
        case IdeaStatus.LIVE: return 'bg-green-100 text-green-700 border border-green-200 shadow-sm';
        default: return 'bg-sand-100';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="relative w-64">
                <span className="absolute left-3 top-2.5 text-sand-400">{ICONS.Search}</span>
                <input 
                    type="text" 
                    placeholder="Search ideas..." 
                    className="w-full pl-10 pr-4 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bhumi-500 bg-white"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>
            <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-4 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bhumi-500 bg-white text-sand-700 cursor-pointer"
            >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                ))}
            </select>
            
            <div className="h-8 w-px bg-sand-300 mx-2"></div>

            <button 
                onClick={() => setShowArchived(!showArchived)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    showArchived 
                    ? 'bg-stone-200 text-stone-700 shadow-inner' 
                    : 'text-sand-500 hover:text-bhumi-900 hover:text-bhumi-900 hover:bg-sand-100'
                }`}
                title={showArchived ? "Show Active Pipeline" : "Show Archived/Cancelled Ideas"}
            >
                {ICONS.Archive} 
                {showArchived ? 'Back to Pipeline' : 'Archived'}
            </button>
        </div>
        <button 
          onClick={onAddIdea}
          className="flex items-center gap-2 bg-bhumi-600 hover:bg-bhumi-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all"
        >
          {ICONS.Add}
          <span>New Idea</span>
        </button>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 kanban-scroll">
        {columns.map(status => (
          <div 
            key={status} 
            className={`min-w-[300px] flex-1 flex flex-col rounded-xl border transition-colors max-h-full ${
                status === IdeaStatus.CANCELLED ? 'bg-stone-100 border-stone-200' : 'bg-sand-200/50 border-sand-200'
            }`}
          >
            <div className={`p-3 border-b rounded-t-xl backdrop-blur-sm sticky top-0 z-10 ${
                 status === IdeaStatus.CANCELLED ? 'bg-stone-100 border-stone-200' : 'bg-sand-200 border-sand-200'
            }`}>
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sand-700 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                        status === IdeaStatus.NEW ? 'bg-bhumi-400' :
                        status === IdeaStatus.VALIDATED ? 'bg-bhumi-500' :
                        status === IdeaStatus.IN_PROGRESS ? 'bg-terra-400' :
                        status === IdeaStatus.LIVE ? 'bg-terra-600' :
                        'bg-stone-400'
                    }`}></span>
                    {status}
                </h3>
                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-sand-600 shadow-sm">
                    {getIdeasByStatus(status).length}
                </span>
              </div>
              <p className="text-xs text-sand-500 mt-1 pl-4">{COLUMN_DESCRIPTIONS[status]}</p>
            </div>
            
            <div className="p-3 space-y-3 overflow-y-auto flex-1 kanban-scroll">
              {getIdeasByStatus(status).map(idea => (
                <div 
                  key={idea.id} 
                  className={`bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-all group relative ${
                      idea.status === IdeaStatus.CANCELLED ? 'border-stone-200 opacity-80 hover:opacity-100' : 'border-sand-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${
                        idea.status === IdeaStatus.CANCELLED ? 'bg-stone-100 text-stone-500 border-stone-200' : getPriorityColor(idea.priority)
                    }`}>
                      {idea.priority}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEditIdea(idea); }}
                      className="text-sand-400 hover:text-bhumi-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {ICONS.Edit}
                    </button>
                  </div>
                  
                  <h4 className={`font-bold mb-1 leading-tight cursor-pointer ${
                      idea.status === IdeaStatus.CANCELLED ? 'text-stone-600 line-through decoration-stone-300' : 'text-bhumi-900 hover:text-bhumi-600'
                  }`} onClick={() => onEditIdea(idea)}>{idea.title}</h4>
                  
                  {/* Category/Scope Badge */}
                  <div className="flex items-center gap-1 text-xs text-sand-500 mb-2">
                    {ICONS.Location}
                    <span className="truncate max-w-[200px]">{idea.category || 'Company Wide'}</span>
                  </div>

                  <p className="text-sm text-sand-600 mb-3 line-clamp-3">{idea.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {idea.tags.map(tag => {
                      const normalizedTag = normalizeTag(tag);
                      const displayTag = tag.startsWith('#') ? tag : `#${tag}`;
                      const isSelected = selectedTag === normalizedTag;
                      return (
                        <span 
                          key={tag} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTag(prev => prev === normalizedTag ? '' : normalizedTag);
                          }}
                          className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors border border-transparent ${
                            isSelected 
                              ? 'bg-bhumi-600 text-white border-bhumi-600' 
                              : 'bg-sand-100 text-sand-600 hover:bg-bhumi-100 hover:text-bhumi-700 hover:border-bhumi-200'
                          }`}
                          title="Filter by this tag"
                        >
                          {displayTag}
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center text-sand-400 text-xs mt-2 pt-2 border-t border-sand-100">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-sand-100 flex items-center justify-center text-[10px] font-bold text-sand-600">
                            {idea.author.charAt(0)}
                        </div>
                        <span>{new Date(idea.createdAt).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         {/* Archive Button */}
                         {idea.status !== IdeaStatus.CANCELLED && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(idea, IdeaStatus.CANCELLED); }} 
                                className="hover:text-stone-600 text-sand-300"
                                title="Archive / Cancel Idea"
                            >
                                {ICONS.Archive}
                            </button>
                         )}
                         <button onClick={(e) => { e.stopPropagation(); handleDelete(idea.id); }} className="hover:text-terra-500 text-sand-300">
                             {ICONS.Delete}
                         </button>
                    </div>
                  </div>

                  {/* Status Progress Bar - Only for Active Statuses */}
                  <div className="mt-3 bg-sand-50 rounded-lg p-1 flex gap-0.5">
                      {activeStatuses.map((s) => {
                          const isActive = idea.status === s;
                          return (
                              <button
                                  key={s}
                                  onClick={(e) => { e.stopPropagation(); handleStatusChange(idea, s); }}
                                  className={`flex-1 py-1 rounded text-[9px] font-bold uppercase transition-all ${getStatusColor(s, isActive)}`}
                                  title={`Move to ${s}`}
                              >
                                  {s === IdeaStatus.IN_PROGRESS ? 'WIP' : s}
                              </button>
                          );
                      })}
                  </div>
                </div>
              ))}
              {getIdeasByStatus(status).length === 0 && (
                  <div className="text-center py-8 text-sand-400 text-sm italic border-2 border-dashed border-transparent rounded-lg">
                      {status === IdeaStatus.CANCELLED ? 'No archived ideas found' : 'No ideas here yet'}
                  </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IdeaPipeline;
