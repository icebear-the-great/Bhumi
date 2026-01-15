import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { Idea, IdeaStatus, Priority } from '../types';

interface IdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (idea: Partial<Idea>) => void;
  defaultCampaignId?: string;
  initialIdea?: Idea | null;
  categories: string[];
}

const IdeaModal: React.FC<IdeaModalProps> = ({ isOpen, onClose, onSave, defaultCampaignId, initialIdea, categories }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Reset or populate form when modal opens or initialIdea changes
  useEffect(() => {
    if (isOpen) {
      if (initialIdea) {
        setTitle(initialIdea.title);
        setDescription(initialIdea.description);
        setPriority(initialIdea.priority);
        setCategory(initialIdea.category || categories[0] || '');
        setTagsInput(initialIdea.tags.join(', '));
      } else {
        setTitle('');
        setDescription('');
        setPriority(Priority.MEDIUM);
        setCategory(categories[0] || '');
        setTagsInput('');
      }
    }
  }, [isOpen, initialIdea, categories]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process comma-separated tags and ensure they start with #
    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => tag.startsWith('#') ? tag : `#${tag}`);

    onSave({
      title,
      description,
      priority,
      category,
      status: initialIdea ? initialIdea.status : IdeaStatus.NEW,
      tags: tags,
      createdAt: initialIdea ? initialIdea.createdAt : new Date(),
      author: initialIdea ? initialIdea.author : 'User',
      comments: initialIdea ? initialIdea.comments : [],
      campaignId: initialIdea?.campaignId || defaultCampaignId
    });
  };

  return (
    <div className="fixed inset-0 bg-bhumi-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-sand-200">
        <div className="p-6 border-b border-sand-200 flex justify-between items-center bg-sand-50">
          <h2 className="text-xl font-bold text-bhumi-900 flex items-center gap-2">
            {initialIdea ? ICONS.Edit : ICONS.Add} {initialIdea ? 'Edit Idea' : 'New Idea'} 
            {defaultCampaignId && !initialIdea?.campaignId && <span className="text-sm font-normal text-sand-500 bg-sand-100 px-2 py-0.5 rounded-full">Linked to Initiative</span>}
          </h2>
          <button onClick={onClose} className="text-sand-400 hover:text-terra-600">
             X
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full border border-sand-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-bhumi-500 focus:border-transparent outline-none bg-white"
                  placeholder="e.g., Summer Solstice Campaign"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">Description</label>
                <textarea 
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="w-full border border-sand-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-bhumi-500 focus:border-transparent outline-none resize-none bg-white"
                  placeholder="Describe the campaign concept..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Category (Scope)</label>
                    <select 
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full border border-sand-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-bhumi-500 outline-none bg-white"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Priority</label>
                    <select 
                      value={priority}
                      onChange={e => setPriority(e.target.value as Priority)}
                      className="w-full border border-sand-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-bhumi-500 outline-none bg-white"
                    >
                      {Object.values(Priority).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">Tags</label>
                <input 
                  type="text"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  className="w-full border border-sand-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-bhumi-500 focus:border-transparent outline-none bg-white placeholder:text-sand-300"
                  placeholder="e.g. Social, Event, Q3 (comma separated)"
                />
                <p className="text-xs text-sand-400 mt-1">Tags will automatically be prefixed with #</p>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sand-600 hover:bg-sand-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-bhumi-600 text-white rounded-lg hover:bg-bhumi-700 shadow-sm font-medium">
                  {initialIdea ? 'Update Idea' : 'Save Idea'}
                </button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default IdeaModal;