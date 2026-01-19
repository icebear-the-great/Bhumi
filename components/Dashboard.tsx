import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Idea, Campaign, IdeaStatus } from '../types';
import { ICONS } from '../constants';

interface DashboardProps {
  ideas: Idea[];
  campaigns: Campaign[];
}

const Dashboard: React.FC<DashboardProps> = ({ ideas, campaigns }) => {
  
  const ideasByStatus = Object.values(IdeaStatus).map(status => ({
    name: status,
    value: ideas.filter(i => i.status === status).length
  }));

  const activeCampaigns = campaigns.filter(c => c.status === 'Active');

  // Earthy tones for chart
  const COLORS = ['#9cbfa5', '#729f7f', '#528260', '#df7654', '#b09e7d'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Branding Header for Dashboard */}
      <div className="flex items-center gap-4 mb-2 pb-6 border-b border-sand-200">
         <div>
            <h2 className="text-2xl font-bold text-bhumi-900">Marketing Overview</h2>
            <p className="text-sand-500">Performance metrics and pipeline status.</p>
         </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-sand-200 flex items-start justify-between transition-transform hover:-translate-y-1 duration-300">
          <div>
            <p className="text-sand-500 text-sm font-medium mb-1">Total Ideas</p>
            <h3 className="text-3xl font-bold text-bhumi-900">{ideas.length}</h3>
            <p className="text-bhumi-600 text-xs font-medium mt-2 flex items-center gap-1">
              {ICONS.Trending} +12% this month
            </p>
          </div>
          <div className="p-3 bg-bhumi-50 text-bhumi-600 rounded-lg">
            {ICONS.Ideas}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-sand-200 flex items-start justify-between transition-transform hover:-translate-y-1 duration-300">
          <div>
            <p className="text-sand-500 text-sm font-medium mb-1">Active Initiatives</p>
            <h3 className="text-3xl font-bold text-bhumi-900">{activeCampaigns.length}</h3>
            <p className="text-sand-400 text-xs font-medium mt-2">
              Across {new Set(activeCampaigns.map(c => c.channel)).size} channels
            </p>
          </div>
          <div className="p-3 bg-terra-50 text-terra-600 rounded-lg">
            {ICONS.Campaigns}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-sand-200">
          <h3 className="text-lg font-bold text-bhumi-900 mb-6">Idea Pipeline Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ideasByStatus}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e0d2" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#826f54', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#826f54', fontSize: 12}} />
                <Tooltip 
                    cursor={{fill: '#faf9f6'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff'}}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {ideasByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-sand-200">
            <h3 className="text-lg font-bold text-bhumi-900 mb-6">Recent Activity</h3>
            <div className="space-y-4">
                {ideas.slice(0, 5).map((idea) => (
                    <div key={idea.id} className="flex items-center justify-between pb-4 border-b border-sand-100 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${idea.status === 'Live' ? 'bg-bhumi-500' : 'bg-terra-500'}`}></div>
                            <div>
                                <h4 className="font-medium text-bhumi-900 text-sm">{idea.title}</h4>
                                <p className="text-xs text-sand-500">Updated by {idea.author} • {idea.status}</p>
                            </div>
                        </div>
                        <span className="text-xs text-sand-400">{new Date(idea.createdAt).toLocaleDateString()}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
