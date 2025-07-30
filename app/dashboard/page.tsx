'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface UserData {
  username: string;
  chips: number;
  userId: string;
  loginTime: string;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user data from URL params or sessionStorage
    const urlUser = searchParams.get('user');
    const urlBalance = searchParams.get('balance');
    const urlUserId = searchParams.get('userId');

    let sessionUser: UserData | null = null;
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('casinoUser');
      if (stored) {
        sessionUser = JSON.parse(stored);
      }
    }

    // Combine data sources, preferring URL params
    const finalUserData: UserData = {
      username: urlUser || sessionUser?.username || 'Unknown Player',
      chips: parseInt(urlBalance || sessionUser?.chips?.toString() || '0'),
      userId: urlUserId || sessionUser?.userId || '',
      loginTime: sessionUser?.loginTime || new Date().toISOString()
    };

    // Update sessionStorage with current data
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('casinoUser', JSON.stringify(finalUserData));
    }

    setUserData(finalUserData);
    setLoading(false);

    // Redirect if no user data
    if (!finalUserData.username || finalUserData.username === 'Unknown Player') {
      alert('🚫 No active session found. Redirecting to login...');
      router.push('/');
    }
  }, [searchParams, router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('casinoUser');
    }
    router.push('/');
  };

  const playGame = (gameType: string) => {
    if (!userData) return;
    
    if (gameType === 'slots') {
      // Navigate to slots page
      router.push('/slots');
    } else if (gameType === 'history') {
      // Show game history
      alert(`📈 Game History:\n\n🃏 Poker: 3 wins, 2 losses\n🂡 Blackjack: 1 win, 1 loss\n🎡 Roulette: 0 wins, 2 losses\n\nTotal: +$150 tonight!`);
    } else {
      alert(`🎰 Starting ${gameType.toUpperCase()}!\n\nPlayer: ${userData.username}\nBalance: $${userData.chips.toLocaleString()}\n\n(Game integration with n8n coming soon!)`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-yellow-400 text-xl">Loading casino...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white p-8">
      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="fixed top-8 right-8 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:shadow-lg hover:shadow-red-500/50 hover:-translate-y-1"
      >
        🚪 Logout
      </button>

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent mb-4">
          Thayne's Casino
        </h1>
      </div>

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border-2 border-yellow-500 rounded-2xl p-8 mb-12 text-center backdrop-blur-sm">
        <div className="text-3xl text-red-400 font-bold mb-2">
          Welcome, <span className="text-yellow-400">{userData?.username}</span>!
        </div>
        <div className="text-5xl font-black text-teal-400">
          Balance: ${userData?.chips.toLocaleString()}
        </div>
      </div>

      {/* Games grid */}
      <div className="mb-12">
        <h2 className="text-4xl font-bold text-center text-yellow-400 mb-8">🎲 Casino Floor</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div 
            onClick={() => playGame('slots')}
            className="bg-slate-800/90 border-2 border-teal-400 rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-2 hover:border-yellow-500 hover:shadow-lg hover:shadow-yellow-500/30 group"
          >
            <div className="text-6xl mb-4 group-hover:animate-bounce">🎰</div>
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">Digital Slots</h3>
            <p className="text-green-400 mb-6">Spin the reels on your phone. Jackpots await!</p>
            <div className="bg-teal-400 text-slate-900 px-6 py-3 rounded-xl font-bold inline-block">
              Play Now
            </div>
          </div>

          <div 
            onClick={() => playGame('history')}
            className="bg-slate-800/90 border-2 border-teal-400 rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-2 hover:border-yellow-500 hover:shadow-lg hover:shadow-yellow-500/30 group"
          >
            <div className="text-6xl mb-4 group-hover:animate-pulse">📈</div>
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">Your Game History</h3>
            <p className="text-green-400 mb-6">See how you've performed tonight across all games.</p>
            <div className="bg-teal-400 text-slate-900 px-6 py-3 rounded-xl font-bold inline-block">
              View Stats
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-slate-800/90 border-2 border-yellow-500 rounded-2xl p-8">
        <h3 className="text-3xl font-bold text-yellow-400 text-center mb-8">🏆 Tonight's High Rollers</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white/10 p-4 rounded-xl border-l-4 border-teal-400">
            <span className="font-bold text-yellow-400 text-xl">#1</span>
            <span className="text-green-400 text-lg">{userData?.username}</span>
            <span className="text-red-400 font-bold text-xl">${userData?.chips.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center bg-white/10 p-4 rounded-xl border-l-4 border-teal-400">
            <span className="font-bold text-yellow-400 text-xl">#2</span>
            <span className="text-green-400 text-lg">Player 2</span>
            <span className="text-red-400 font-bold text-xl">$1,800</span>
          </div>
          <div className="flex justify-between items-center bg-white/10 p-4 rounded-xl border-l-4 border-teal-400">
            <span className="font-bold text-yellow-400 text-xl">#3</span>
            <span className="text-green-400 text-lg">Player 3</span>
            <span className="text-red-400 font-bold text-xl">$1,500</span>
          </div>
        </div>
      </div>

      {/* Tech status */}
      <div className="fixed bottom-8 left-8 bg-slate-700/90 border border-yellow-500/30 rounded-xl px-4 py-2 text-sm text-yellow-400">
        <div>🔗 Architecture: Vercel + n8n</div>
        <div>✅ Session Active</div>
        <div>🎰 Ready to Play</div>
      </div>
    </div>
  );
}

export default function CasinoDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-yellow-400 text-xl">Loading casino...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
