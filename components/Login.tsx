import React, { useState } from 'react';
import { ICONS } from '../constants';
import { db } from '../services/db';
import { User } from '../types';
import { updateFirebaseConfig, getIsDemoMode, clearFirebaseConfig } from '../services/firebaseConfig';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Config Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configJson, setConfigJson] = useState('');

  const isDemo = getIsDemoMode();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        const user = await db.login(email, password);
        if (user) {
            onLogin(user);
        } else {
            setError('Invalid email or password. Please try again.');
            setLoading(false);
        }
    } catch (e) {
        setError('Connection error. Please try again.');
        setLoading(false);
    }
  };

  const handleSaveConfig = () => {
      try {
          // Allow flexible input (standard JSON or JS object style loose JSON if user pastes from docs)
          // For safety, we stick to standard JSON parsing first.
          // Users should paste: {"apiKey": "...", ...}
          const config = JSON.parse(configJson);
          if (!config.apiKey || !config.projectId) {
              alert("Invalid Config: Missing apiKey or projectId");
              return;
          }
          updateFirebaseConfig(config);
      } catch (e) {
          alert("Invalid JSON format. Please check your syntax.");
      }
  };

  return (
    <div className="min-h-screen bg-sand-100 flex items-center justify-center p-4 relative">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-sand-200 animate-fade-in-up z-10">
        
        {/* Brand Header */}
        <div className="bg-earth-300 p-8 text-center flex flex-col items-center justify-center border-b border-sand-300 relative">
            <img 
              src="/bhumi-logo.png" 
              alt="BhumiHub" 
              className="h-24 w-auto mb-4 object-contain"
              onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="bg-bhumi-900 p-3 rounded-xl text-white mb-3 shadow-md hidden">
                {ICONS.Brand}
            </div>
            
            <h1 className="text-2xl font-bold text-bhumi-900 tracking-tight">BhumiHub</h1>
            <p className="text-bhumi-800/80 text-sm font-medium mt-1">Marketing Operations Platform</p>
            
            {isDemo && (
                <span className="absolute top-4 right-4 bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full border border-orange-200 uppercase tracking-wide">
                    Demo Mode
                </span>
            )}
        </div>

        {/* Login Form */}
        <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                        {ICONS.Alert}
                        {error}
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-semibold text-sand-700 mb-1.5">Email Address</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-sand-400">{ICONS.Users}</span>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-sand-300 rounded-lg focus:ring-2 focus:ring-bhumi-500 outline-none text-bhumi-900 bg-sand-50/30"
                            placeholder="name@bhumi.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-sand-700 mb-1.5">Password</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-sand-400">{ICONS.Lock}</span>
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-sand-300 rounded-lg focus:ring-2 focus:ring-bhumi-500 outline-none text-bhumi-900 bg-sand-50/30"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                            loading ? 'bg-sand-400 cursor-wait' : 'bg-bhumi-600 hover:bg-bhumi-700'
                        }`}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </div>
            </form>

            <div className="mt-8 text-center">
                {isDemo ? (
                    <p className="text-xs text-sand-400">
                        Running in Demo Mode (Data will not persist).<br/>
                        Default login: <strong className="text-sand-600">mike.k@bhumi.com / welcome123</strong>
                    </p>
                ) : (
                    <p className="text-xs text-green-600 flex items-center justify-center gap-1">
                        {ICONS.Success} Connected to Live Database
                    </p>
                )}
            </div>
        </div>
      </div>

      {/* Config Button */}
      <div className="fixed bottom-4 right-4 z-20">
          <button 
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 bg-white/80 backdrop-blur text-sand-500 hover:text-bhumi-900 px-3 py-2 rounded-full shadow-sm border border-sand-200 text-xs font-medium transition-colors"
          >
              {ICONS.Settings} Database Settings
          </button>
      </div>

      {/* Config Modal */}
      {showConfigModal && (
          <div className="fixed inset-0 bg-bhumi-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-sand-200 overflow-hidden animate-fade-in-up">
                  <div className="p-6 border-b border-sand-200 flex justify-between items-center bg-sand-50">
                      <h3 className="font-bold text-bhumi-900">Database Configuration</h3>
                      <button onClick={() => setShowConfigModal(false)} className="text-sand-400 hover:text-stone-600">
                          {ICONS.Close}
                      </button>
                  </div>
                  <div className="p-6">
                      <p className="text-sm text-sand-600 mb-4">
                          Paste your Firebase configuration object JSON below to connect to your live database. 
                          <br/><span className="text-xs text-sand-400">Obtain this from Firebase Console {'>'} Project Settings.</span>
                      </p>
                      
                      <textarea
                          value={configJson}
                          onChange={e => setConfigJson(e.target.value)}
                          placeholder='{ "apiKey": "...", "authDomain": "...", ... }'
                          className="w-full h-48 border border-sand-300 rounded-lg p-3 text-xs font-mono bg-stone-50 focus:ring-2 focus:ring-bhumi-500 outline-none resize-none mb-4"
                      />

                      <div className="flex justify-between items-center">
                          {!isDemo ? (
                              <button 
                                onClick={clearFirebaseConfig}
                                className="text-red-500 hover:text-red-700 text-sm font-medium hover:underline"
                              >
                                  Disconnect & Reset
                              </button>
                          ) : <div></div>}
                          
                          <div className="flex gap-2">
                            <button onClick={() => setShowConfigModal(false)} className="px-4 py-2 text-sand-600 hover:bg-sand-100 rounded-lg text-sm">Cancel</button>
                            <button 
                                onClick={handleSaveConfig} 
                                className="px-4 py-2 bg-bhumi-600 text-white rounded-lg hover:bg-bhumi-700 text-sm font-medium shadow-sm"
                            >
                                Save & Restart
                            </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Login;
