'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CasinoLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setStatusMessage('Username and password are required');
      setStatusType('error');
      return;
    }

    setLoading(true);
    setStatusMessage('🎰 Validating VIP credentials...');
    setStatusType('success');

    try {
      const response = await fetch('https://thayneautomations.app.n8n.cloud/webhook/casino-validate-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();

      if (data.success && data.user) {
        // Success - store user data and redirect
        setStatusMessage(`🎉 Welcome to the high roller table, ${data.user.Name}! Redirecting...`);
        setStatusType('success');

        // Store user data in sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('casinoUser', JSON.stringify({
            username: data.user.Name,
            chips: data.user['Current Account Balance'],
            userId: data.user.id,
            password: data.user.Password,
            loginTime: new Date().toISOString()
          }));
        }

        // Redirect to dashboard after delay
        setTimeout(() => {
          router.push(`/dashboard?user=${encodeURIComponent(data.user.Name)}&balance=${data.user['Current Account Balance']}&userId=${data.user.id}`);
        }, 1500);

      } else {
        // Failed login
        setStatusMessage(data.message || '❌ Invalid credentials. The bouncer says no dice!');
        setStatusType('error');
        setLoading(false);
      }

    } catch (error) {
      console.error('Login error:', error);
      setStatusMessage('🎰 Connection error. Casino systems temporarily down!');
      setStatusType('error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Animated background chips */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-10 h-10 bg-red-500 rounded-full opacity-10 animate-bounce" style={{
          top: '20%', left: '10%', animationDelay: '0s', animationDuration: '20s'
        }}></div>
        <div className="absolute w-10 h-10 bg-teal-400 rounded-full opacity-10 animate-bounce" style={{
          top: '60%', right: '20%', animationDelay: '5s', animationDuration: '25s'
        }}></div>
        <div className="absolute w-10 h-10 bg-yellow-400 rounded-full opacity-10 animate-bounce" style={{
          top: '80%', left: '20%', animationDelay: '10s', animationDuration: '30s'
        }}></div>
        <div className="absolute w-10 h-10 bg-green-400 rounded-full opacity-10 animate-bounce" style={{
          top: '30%', right: '30%', animationDelay: '15s', animationDuration: '22s'
        }}></div>
      </div>

      {/* Main container */}
      <div className="relative z-10 bg-slate-800/95 backdrop-blur-xl border-2 border-yellow-500 rounded-3xl p-12 shadow-2xl shadow-yellow-500/30 max-w-md w-full mx-4 animate-pulse-glow">
        {/* Dice decoration */}
        <div className="absolute -top-5 -right-5 text-4xl animate-spin" style={{animationDuration: '4s'}}>
          🎲
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent mb-2 animate-shimmer">
            Thayne's Casino
          </h1>
          <p className="text-red-400 text-lg uppercase tracking-wider font-semibold">
            High Roller Access
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username field */}
          <div>
            <label htmlFor="username" className="block text-yellow-400 font-bold mb-2 uppercase text-sm tracking-wide">
              Player Name
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              required
              disabled={loading}
              className="w-full p-4 border-2 border-teal-400 rounded-xl bg-white/10 text-white placeholder:text-white/60 font-mono focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/50 focus:bg-white/15 transition-all duration-300 disabled:opacity-50"
            />
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="password" className="block text-yellow-400 font-bold mb-2 uppercase text-sm tracking-wide">
              VIP Code
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
              className="w-full p-4 border-2 border-teal-400 rounded-xl bg-white/10 text-white placeholder:text-white/60 font-mono focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/50 focus:bg-white/15 transition-all duration-300 disabled:opacity-50"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 px-6 rounded-xl uppercase tracking-wider text-lg transition-all duration-300 hover:shadow-lg hover:shadow-red-500/50 hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Checking credentials...
              </span>
            ) : (
              <>🎰 Enter Casino 🎰</>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
          </button>

          {/* Status message */}
          {statusMessage && (
            <div className={`p-4 rounded-xl font-semibold text-center transition-all duration-300 ${
              statusType === 'success' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                : 'bg-red-500/20 text-red-400 border border-red-500/50'
            }`}>
              {statusMessage}
            </div>
          )}
        </form>

        {/* Footer message */}
        <p className="text-green-400 text-center mt-8 italic text-sm">
          "The house always wins... but tonight, we're all family! 🃏"
        </p>

        {/* Tech badge */}
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-slate-700 px-4 py-1 rounded-full text-xs text-yellow-400 border border-yellow-500/30">
          Powered by Vercel + n8n
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(234, 179, 8, 0.3); }
          50% { box-shadow: 0 0 40px rgba(234, 179, 8, 0.5); }
        }
        .animate-shimmer {
          background-size: 200% 200%;
          animation: shimmer 3s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
