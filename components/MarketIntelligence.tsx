import React, { useState } from 'react';
import { ICONS } from '../constants';
import { performMarketResearch } from '../services/geminiService';
import { MarketResearchResult } from '../types';

const MarketIntelligence: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MarketResearchResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const data = await performMarketResearch(query);
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
      <div className="mb-8 text-center space-y-2">
        <h2 className="text-3xl font-bold text-stone-800 flex items-center justify-center gap-3">
          <span className="p-2 bg-blue-100 rounded-xl text-blue-600">{ICONS.Globe}</span>
          Market Intelligence
        </h2>
        <p className="text-stone-500">
          Research competitors, trends, and news with real-time Google Search data.
        </p>
      </div>

      {/* Search Input */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="relative shadow-lg rounded-2xl">
          <div className="absolute left-5 top-4 text-stone-400">
            {ICONS.Search}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Top sustainable fashion trends 2024 or Lululemon's latest marketing campaign"
            className="w-full pl-14 pr-32 py-4 text-lg border-2 border-transparent focus:border-bhumi-400 rounded-2xl outline-none transition-all placeholder:text-stone-300 font-medium text-stone-700"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query}
            className={`absolute right-2 top-2 bottom-2 px-6 rounded-xl font-bold transition-all flex items-center gap-2 ${
              loading || !query
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : 'bg-bhumi-600 hover:bg-bhumi-700 text-white shadow-md'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Researching...</span>
              </>
            ) : (
              <>
                {ICONS.AI}
                <span>Analyze</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-auto space-y-6">
        {result ? (
          <div className="animate-fade-in-up">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                <h3 className="font-bold text-stone-800 flex items-center gap-2">
                  {ICONS.Trending} Insight Report
                </h3>
                <span className="text-xs text-stone-400">
                  Generated {result.timestamp.toLocaleTimeString()}
                </span>
              </div>
              
              <div className="p-8 prose prose-stone max-w-none">
                <div className="whitespace-pre-wrap leading-relaxed text-stone-700">
                  {result.content}
                </div>
              </div>

              {/* Sources Section */}
              {result.sources.length > 0 && (
                <div className="bg-stone-50 p-6 border-t border-stone-200">
                  <h4 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    {ICONS.Globe} Sources
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-white border border-stone-200 rounded-lg hover:border-bhumi-400 hover:shadow-md transition-all group"
                      >
                        <div className="bg-blue-50 text-blue-500 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium text-stone-800 truncate group-hover:text-bhumi-700">
                            {source.title}
                          </p>
                          <p className="text-xs text-stone-400 truncate">
                            {source.uri}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          !loading && (
            <div className="flex flex-col items-center justify-center h-64 text-stone-300">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4 text-stone-400">
                {ICONS.Search}
              </div>
              <p className="text-lg font-medium">Ready to explore the market</p>
              <p className="text-sm">Enter a topic to generate an AI-powered research report.</p>
              
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                 <button onClick={() => {setQuery("Competitor analysis for sustainable activewear");}} className="p-3 text-sm border border-stone-200 rounded-lg hover:bg-white hover:shadow-sm transition-all text-stone-500 text-left">
                    🌱 Competitor analysis for sustainable activewear
                 </button>
                 <button onClick={() => {setQuery("Marketing trends for Gen Z in 2025");}} className="p-3 text-sm border border-stone-200 rounded-lg hover:bg-white hover:shadow-sm transition-all text-stone-500 text-left">
                    📈 Marketing trends for Gen Z in 2025
                 </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default MarketIntelligence;
