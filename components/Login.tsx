import React, { useState } from 'react';
import { ICONS } from '../constants';
import { db } from '../services/db';
import { User } from '../types';
import { getIsDemoMode } from '../services/firebaseConfig';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const isDemo = getIsDemoMode();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowHelp(false);
    setLoading(true);

    try {
        const user = await db.login(email, password);
        if (user) {
            onLogin(user);
        } else {
            setError('Invalid email or password.');
            setLoading(false);
        }
    } catch (anyError: any) {
        console.error("Login Error:", anyError);
        
        const code = anyError?.code;
        const msg = anyError?.message || '';

        if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
            setError('Incorrect email or password.');
        } else if (code === 'auth/too-many-requests') {
            setError('Too many failed attempts. Please try again later.');
        } else if (code === 'auth/operation-not-allowed') {
            setError('Email/Password Sign-in is not enabled in Firebase Console.');
            setShowHelp(true);
        } else if (code === 'auth/network-request-failed') {
            setError('Network error. Check your internet connection.');
        } else if (code === 'permission-denied' || msg.includes('Missing or insufficient permissions')) {
            setError('Database Permission Denied. Check Firestore Rules.');
            setShowHelp(true);
        } else if (msg.includes('API key')) {
            setError('Configuration Error: Invalid API Key.');
        } else {
            setError(msg || 'Connection error. Please try again.');
        }
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand-100 flex items-center justify-center p-4 relative">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-sand-200 animate-fade-in-up z-10">
        
        {/* Brand Header */}
        <div className={`p-8 text-center flex flex-col items-center justify-center border-b border-sand-300 relative transition-colors ${isDemo ? 'bg-earth-300' : 'bg-bhumi-900'}`}>
            <img 
              src="/bhumi-logo.png" 
              alt="BhumiHub" 
              className="h-24 w-auto mb-4 object-contain"
              onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="bg-bhumi-800 p-3 rounded-xl text-white mb-3 shadow-md hidden">
                {ICONS.Brand}
            </div>
            
            <h1 className={`text-2xl font-bold tracking-tight ${isDemo ? 'text-bhumi-900' : 'text-white'}`}>BhumiHub</h1>
            <p className={`text-sm font-medium mt-1 ${isDemo ? 'text-bhumi-800/80' : 'text-white/70'}`}>Marketing Operations Platform</p>
            
            <div className="absolute top-4 right-4 flex flex-col items-end">
                {isDemo ? (
                    <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full border border-orange-200 uppercase tracking-wide">
                        Demo Mode
                    </span>
                ) : (
                    <span className="bg-green-500/20 text-green-100 text-[10px] font-bold px-2 py-1 rounded-full border border-green-500/30 uppercase tracking-wide flex items-center gap-1 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                        Connected
                    </span>
                )}
            </div>
        </div>

        {/* Login Form */}
        <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex flex-col gap-1 border border-red-100 break-words">
                        <div className="flex items-center gap-2 font-semibold">
                            <span className="shrink-0">{ICONS.Alert}</span>
                            <span>Login Failed</span>
                        </div>
                        <span className="text-red-800 leading-tight ml-6">{error}</span>
                        {showHelp && (
                            <div className="ml-6 mt-1 text-xs text-red-700 bg-red-100/50 p-2 rounded">
                                <strong>Troubleshooting:</strong>
                                <ul className="list-disc ml-4 mt-1 space-y-1">
                                    <li>Ensure "Email/Password" provider is enabled in Firebase Console &gt; Authentication &gt; Sign-in method.</li>
                                    <li>Check Firestore Rules allow reads.</li>
                                </ul>
                            </div>
                        )}
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
                    <p className="text-xs text-sand-400">
                        Connected to Firebase.<br/>
                        Please login with your <strong className="text-sand-600">Authentication credentials</strong>.<br/>
                        (Ensure the user exists in the Authentication tab, not just Database)
                    </p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
