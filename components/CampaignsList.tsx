import React, { useState } from 'react';
import { Campaign } from '../types';
import { ICONS } from '../constants';

interface CampaignsListProps {
  campaigns: Campaign[];
  onSelectCampaign: (id: string) => void;
  onCreateCampaign: () => void;
  onUpdateCampaign: (campaign: Campaign) => void;
}

const CampaignsList: React.FC<CampaignsListProps> = ({ campaigns, onSelectCampaign, onCreateCampaign, onUpdateCampaign }) => {
  const [statusFilter, setStatusFilter] = useState('All');
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const handleStartLinking = (e: React.MouseEvent, campaignId: string) => {
    e.stopPropagation();
    setLinkingId(campaignId);
  };

  const handleLink = (e: React.ChangeEvent<HTMLSelectElement>, campaign: Campaign) => {
    e.stopPropagation();
    const targetId = e.target.value;
    if (!targetId) return;

    const currentLinks = campaign.linkedCampaignIds || [];
    if (!currentLinks.includes(targetId)) {
        onUpdateCampaign({ 
            ...campaign, 
            linkedCampaignIds: [...currentLinks, targetId] 
        });
    }
    setLinkingId(null);
  };

  const handleUnlink = (e: React.MouseEvent, campaign: Campaign, targetId: string) => {
      e.stopPropagation();
      const updatedLinks = campaign.linkedCampaignIds?.filter(id => id !== targetId) || [];
      onUpdateCampaign({ 
          ...campaign, 
          linkedCampaignIds: updatedLinks 
      });
  }

  const getCampaignName = (id: string) => {
      return campaigns.find(c => c.id === id)?.name || id;
  }

  const filteredCampaigns = campaigns.filter(c => {
      if (statusFilter === 'All') return c.status !== 'Archived';
      return c.status === statusFilter;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-sand-200 overflow-hidden">
      <div className="p-6 border-b border-sand-200 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-bhumi-900">All Initiatives</h2>
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-sand-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-bhumi-500 outline-none bg-white text-sand-700 cursor-pointer"
            >
                <option value="All">All Active</option>
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>
            </select>
        </div>
        <button 
            onClick={onCreateCampaign}
            className="text-sand-500 hover:text-bhumi-600 text-sm font-medium flex items-center gap-1 transition-colors"
        >
            {ICONS.Add} Create Initiative
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-sand-600">
          <thead className="bg-sand-50 text-sand-500 font-medium border-b border-sand-200">
            <tr>
              <th className="px-6 py-4">Initiative Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Channel</th>
              <th className="px-6 py-4">Linked To</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((camp) => {
                    const isLinking = linkingId === camp.id;
                    const availableCampaigns = campaigns.filter(c => c.id !== camp.id && !camp.linkedCampaignIds?.includes(c.id));

                    return (
                        <tr 
                          key={camp.id} 
                          onClick={() => onSelectCampaign(camp.id)}
                          className="hover:bg-sand-50/50 transition-colors cursor-pointer group"
                        >
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="font-medium text-bhumi-900 group-hover:text-terra-600 transition-colors">{camp.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                        camp.status === 'Active' ? 'bg-bhumi-100 text-bhumi-700' :
                                        camp.status === 'Planning' ? 'bg-sand-100 text-sand-700' :
                                        camp.status === 'Completed' ? 'bg-stone-100 text-stone-600' :
                                        'bg-sand-200 text-sand-500' // Archived
                                    }`}>
                                        {camp.status}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4">{camp.channel}</td>
                            <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1 items-center">
                                    {camp.linkedCampaignIds && camp.linkedCampaignIds.length > 0 ? (
                                        camp.linkedCampaignIds.map(linkId => (
                                            <div key={linkId} className="flex items-center gap-1 bg-sand-100 text-sand-600 px-2 py-1 rounded-md text-xs border border-sand-200">
                                                <span>{getCampaignName(linkId)}</span>
                                                <button 
                                                  onClick={(e) => handleUnlink(e, camp, linkId)} 
                                                  className="hover:text-terra-600"
                                                >
                                                    {ICONS.Unlink}
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        !isLinking && <span className="text-sand-400 italic text-xs">None</span>
                                    )}
                                    
                                    {isLinking ? (
                                        <div className="flex items-center gap-2 animate-fade-in" onClick={e => e.stopPropagation()}>
                                            <select 
                                                autoFocus
                                                className="text-xs border border-sand-300 rounded px-2 py-1 focus:ring-1 focus:ring-bhumi-500 outline-none"
                                                onChange={(e) => handleLink(e, camp)}
                                                defaultValue=""
                                                onBlur={() => setLinkingId(null)}
                                            >
                                                <option value="" disabled>Select initiative...</option>
                                                {availableCampaigns.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                                {availableCampaigns.length === 0 && <option disabled>No other initiatives available</option>}
                                            </select>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setLinkingId(null); }}
                                                className="text-sand-400 hover:text-sand-600"
                                            >
                                                {ICONS.Close}
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={(e) => handleStartLinking(e, camp.id)}
                                            className="p-1 hover:bg-sand-200 rounded text-sand-400 hover:text-bhumi-600 transition-colors"
                                            title="Link an initiative"
                                        >
                                            {ICONS.Link}
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    )
                })
            ) : (
                <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sand-400 italic">
                        No initiatives found with status "{statusFilter}"
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CampaignsList;