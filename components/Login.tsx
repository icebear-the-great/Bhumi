import React, { useState } from 'react';
import { ICONS } from '../constants';
import { db } from '../services/db';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-sand-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-sand-200 animate-fade-in-up">
        
        {/* Brand Header */}
        <div className="bg-earth-300 p-8 text-center flex flex-col items-center justify-center border-b border-sand-300">
            <img 
              src="/bhumi-logo.png" 
              alt="BhumiHub" 
              className="h-24 w-auto mb-4 object-contain"
              onError={(e) => {
                 // Fallback to icon if image missing
                 e.currentTarget.style.display = 'none';
                 e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            {/* Fallback Icon Container (hidden by default if image loads) */}
            <div className="bg-bhumi-900 p-3 rounded-xl text-white mb-3 shadow-md hidden">
                {ICONS.Brand}
            </div>
            
            <h1 className="text-2xl font-bold text-bhumi-900 tracking-tight">BhumiHub</h1>
            <p className="text-bhumi-800/80 text-sm font-medium mt-1">Marketing Operations Platform</p>
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
                <p className="text-xs text-sand-400">
                    Protected System. Authorized Personnel Only.<br/>
                    Default login: mike.k@bhumi.com / welcome123
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;