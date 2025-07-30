'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserData {
  username: string;
  chips: number;
  userId: string;
  loginTime: string;
}

interface SessionStats {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  totalWinAmount: number;
  totalLossAmount: number;
  biggestWin: number;
  sessionStart: Date;
}

interface Symbol {
  emoji: string;
  weight: number;
  value: number;
}

export default function SlotsPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentBet, setCurrentBet] = useState(25);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultMessage, setResultMessage] = useState('Place your bet and spin to win!');
  const [resultType, setResultType] = useState<'win' | 'lose' | 'jackpot' | ''>('');
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalGames: 0,
    totalWins: 0,
    totalLosses: 0,
    totalWinAmount: 0,
    totalLossAmount: 0,
    biggestWin: 0,
    sessionStart: new Date()
  });

  // Slot symbols with weights for 55% player advantage
  const symbols: Symbol[] = [
    { emoji: '🍒', weight: 20, value: 2 },
    { emoji: '🍋', weight: 18, value: 3 },
    { emoji: '🍊', weight: 16, value: 4 },
    { emoji: '🍇', weight: 14, value: 5 },
    { emoji: '🔔', weight: 12, value: 8 },
    { emoji: '⭐', weight: 10, value: 10 },
    { emoji: '💎', weight: 6, value: 15 },
    { emoji: '7️⃣', weight: 4, value: 25 }
  ];

  const [reels, setReels] = useState<string[][]>([]);
  const [winningPositions, setWinningPositions] = useState<{col: number, row: number}[]>([]);

  useEffect(() => {
    // Get user data from sessionStorage
    const stored = sessionStorage.getItem('casinoUser');
    if (stored) {
      setUserData(JSON.parse(stored));
    } else {
      alert('🚫 No active session found. Redirecting to login...');
      router.push('/');
    }

    initializeReels();
  }, [router]);

  const createSymbolPool = () => {
    const pool: Symbol[] = [];
    symbols.forEach(symbol => {
      for (let i = 0; i < symbol.weight; i++) {
        pool.push(symbol);
      }
    });
    return pool;
  };

  const getRandomSymbol = () => {
    const pool = createSymbolPool();
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const initializeReels = () => {
    const newReels: string[][] = [];
    for (let col = 0; col < 5; col++) {
      const column: string[] = [];
      for (let row = 0; row < 3; row++) {
        column.push(getRandomSymbol().emoji);
      }
      newReels.push(column);
    }
    setReels(newReels);
  };

  const setBetAmount = (amount: number) => {
    if (isSpinning) return;
    setCurrentBet(amount);
  };

  const recordGameResult = (isWin: boolean, amount: number, betAmount: number) => {
    setSessionStats(prev => {
      const newStats = { ...prev };
      newStats.totalGames++;
      
      if (isWin) {
        newStats.totalWins++;
        newStats.totalWinAmount += amount;
        if (amount > newStats.biggestWin) {
          newStats.biggestWin = amount;
        }
      } else {
        newStats.totalLosses++;
        newStats.totalLossAmount += betAmount;
      }
      
      return newStats;
    });
  };

  const calculateWin = (results: Symbol[][]) => {
    let totalWinnings = 0;
    let winType = '';
    let positions: {col: number, row: number}[] = [];

    // Check horizontal lines
    for (let row = 0; row < 3; row++) {
      const lineSymbols = results.map(col => col[row]);
      const lineResult = checkLine(lineSymbols, row, 'horizontal');
      
      if (lineResult.winnings > 0) {
        totalWinnings += lineResult.winnings;
        winType = lineResult.type;
        positions = positions.concat(lineResult.positions);
      }
    }

    // Check diagonals
    const diagonal1 = [results[0][0], results[1][1], results[2][2], results[3][1], results[4][0]];
    const diagonal2 = [results[0][2], results[1][1], results[2][0], results[3][1], results[4][2]];

    const diag1Result = checkLineDiagonal(diagonal1, 'diagonal1');
    const diag2Result = checkLineDiagonal(diagonal2, 'diagonal2');

    if (diag1Result.winnings > 0) {
      totalWinnings += diag1Result.winnings;
      winType = diag1Result.type;
      positions = positions.concat(diag1Result.positions);
    }

    if (diag2Result.winnings > 0) {
      totalWinnings += diag2Result.winnings;
      winType = diag2Result.type;
      positions = positions.concat(diag2Result.positions);
    }

    return {
      isWin: totalWinnings > 0,
      winnings: totalWinnings,
      winType,
      winningPositions: positions
    };
  };

  const checkLine = (lineSymbols: Symbol[], rowIndex: number, lineType: string) => {
    for (let start = 0; start <= 2; start++) {
      let count = 1;
      let symbol = lineSymbols[start];
      
      for (let i = start + 1; i < 5; i++) {
        if (lineSymbols[i].emoji === symbol.emoji) {
          count++;
        } else {
          break;
        }
      }
      
      if (count >= 3) {
        let multiplier = count === 3 ? 1 : count === 4 ? 3 : 8;
        let winnings = currentBet * symbol.value * multiplier;
        
        let positions = [];
        for (let i = start; i < start + count; i++) {
          positions.push({ col: i, row: rowIndex });
        }
        
        return {
          winnings,
          type: symbol.emoji === '7️⃣' && count >= 4 ? 'JACKPOT' : 'WIN',
          positions
        };
      }
    }
    
    return { winnings: 0, type: '', positions: [] };
  };

  const checkLineDiagonal = (lineSymbols: Symbol[], diagonalType: string) => {
    // Similar logic for diagonal checking
    for (let start = 0; start <= 2; start++) {
      let count = 1;
      let symbol = lineSymbols[start];
      
      for (let i = start + 1; i < 5; i++) {
        if (lineSymbols[i].emoji === symbol.emoji) {
          count++;
        } else {
          break;
        }
      }
      
      if (count >= 3) {
        let multiplier = count === 3 ? 1 : count === 4 ? 3 : 8;
        let winnings = currentBet * symbol.value * multiplier;
        
        let positions = [];
        for (let i = start; i < start + count; i++) {
          if (diagonalType === 'diagonal1') {
            positions.push({ col: i, row: i === 2 ? 2 : i === 1 || i === 3 ? 1 : 0 });
          } else {
            positions.push({ col: i, row: i === 0 || i === 4 ? 2 : i === 2 ? 0 : 1 });
          }
        }
        
        return {
          winnings,
          type: symbol.emoji === '7️⃣' && count >= 4 ? 'JACKPOT' : 'WIN',
          positions
        };
      }
    }
    
    return { winnings: 0, type: '', positions: [] };
  };

  const spin = async () => {
    if (!userData || isSpinning || userData.chips < currentBet) {
      if (userData && userData.chips < currentBet) {
        setResultMessage('Not enough chips! Go see Thayne for more.');
        setResultType('lose');
      }
      return;
    }

    setIsSpinning(true);
    setResultMessage('Spinning...');
    setResultType('');
    setWinningPositions([]);

    // Deduct bet amount
    const newBalance = userData.chips - currentBet;
    setUserData(prev => prev ? { ...prev, chips: newBalance } : null);
    
    // Update sessionStorage
    sessionStorage.setItem('casinoUser', JSON.stringify({
      ...userData,
      chips: newBalance
    }));

    // Simulate spinning animation
    setTimeout(() => {
      // Generate new results
      const results: Symbol[][] = [];
      for (let col = 0; col < 5; col++) {
        const column: Symbol[] = [];
        for (let row = 0; row < 3; row++) {
          column.push(getRandomSymbol());
        }
        results.push(column);
      }

      // Update reels display
      const newReelsDisplay = results.map(col => col.map(symbol => symbol.emoji));
      setReels(newReelsDisplay);

      // Calculate win
      const { isWin, winnings, winType, winningPositions } = calculateWin(results);
      
      if (isWin) {
        const finalBalance = newBalance + winnings;
        setUserData(prev => prev ? { ...prev, chips: finalBalance } : null);
        sessionStorage.setItem('casinoUser', JSON.stringify({
          ...userData,
          chips: finalBalance
        }));
        
        setResultMessage(`${winType}! You won $${winnings}!`);
        setResultType(winType === 'JACKPOT' ? 'jackpot' : 'win');
        setWinningPositions(winningPositions);
        recordGameResult(true, winnings, currentBet);
      } else {
        setResultMessage('No luck this time. Try again!');
        setResultType('lose');
        recordGameResult(false, 0, currentBet);
      }

      setTimeout(() => {
        setIsSpinning(false);
        setWinningPositions([]);
      }, 2000);

    }, 1500);
  };

  const goBack = () => {
    const sessionDuration = Math.round((new Date().getTime() - sessionStats.sessionStart.getTime()) / 1000 / 60);
    const netWinnings = sessionStats.totalWinAmount - sessionStats.totalLossAmount;
    const winRate = sessionStats.totalGames > 0 ? 
      Math.round((sessionStats.totalWins / sessionStats.totalGames) * 100) : 0;

    const summaryText = `🎰 SLOT MACHINE SESSION SUMMARY 🎰\n\n` +
      `⏱️ Session Duration: ${sessionDuration} minutes\n` +
      `🎮 Games Played: ${sessionStats.totalGames}\n` +
      `🏆 Wins: ${sessionStats.totalWins}\n` +
      `💸 Losses: ${sessionStats.totalLosses}\n` +
      `📊 Win Rate: ${winRate}%\n\n` +
      `💰 Total Won: $${sessionStats.totalWinAmount}\n` +
      `💸 Total Lost: $${sessionStats.totalLossAmount}\n` +
      `🎯 Net Result: ${netWinnings >= 0 ? '+' : ''}$${netWinnings}\n` +
      `🚀 Biggest Win: $${sessionStats.biggestWin}\n\n` +
      `Return to dashboard?`;

    if (confirm(summaryText)) {
      router.push('/dashboard');
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-yellow-400 text-xl">Loading casino...</p>
        </div>
      </div>
    );
  }

  const netWinnings = sessionStats.totalWinAmount - sessionStats.totalLossAmount;
  const winRate = sessionStats.totalGames > 0 ? 
    Math.round((sessionStats.totalWins / sessionStats.totalGames) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Back button */}
      <button
        onClick={goBack}
        className="fixed top-5 left-5 z-50 px-6 py-3 bg-teal-400/80 hover:bg-teal-400 rounded-xl font-bold transition-all duration-300 hover:-translate-y-1"
      >
        ← Dashboard
      </button>

      {/* Header */}
      <header className="bg-slate-800/95 backdrop-blur-xl border-b-2 border-yellow-500 p-4 sticky top-0 z-40">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-yellow-400">🎰 Lucky Slots</h1>
          <div className="flex items-center gap-6">
            <div className="text-green-400 text-lg">Good luck, {userData.username}!</div>
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-3 rounded-full border-2 border-yellow-500 font-bold text-xl animate-pulse">
              💰 ${userData.chips.toLocaleString()}
            </div>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-4xl mx-auto">
        {/* Stats Panel */}
        <div className="bg-slate-800/90 border-2 border-teal-400 rounded-2xl p-6 mb-8 grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center p-3 bg-white/5 rounded-xl">
            <div className="text-green-400 text-sm uppercase tracking-wide mb-1">Games Played</div>
            <div className="text-yellow-400 text-xl font-bold">{sessionStats.totalGames}</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-xl">
            <div className="text-green-400 text-sm uppercase tracking-wide mb-1">Total Wins</div>
            <div className="text-green-400 text-xl font-bold">{sessionStats.totalWins}</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-xl">
            <div className="text-green-400 text-sm uppercase tracking-wide mb-1">Total Losses</div>
            <div className="text-red-400 text-xl font-bold">{sessionStats.totalLosses}</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-xl">
            <div className="text-green-400 text-sm uppercase tracking-wide mb-1">Win Rate</div>
            <div className="text-yellow-400 text-xl font-bold">{winRate}%</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-xl">
            <div className="text-green-400 text-sm uppercase tracking-wide mb-1">Net Winnings</div>
            <div className={`text-xl font-bold ${netWinnings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${netWinnings}
            </div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-xl">
            <div className="text-green-400 text-sm uppercase tracking-wide mb-1">Biggest Win</div>
            <div className="text-green-400 text-xl font-bold">${sessionStats.biggestWin}</div>
          </div>
        </div>

        {/* Slot Machine */}
        <div className="bg-slate-800/95 border-4 border-yellow-500 rounded-3xl p-8 shadow-2xl shadow-yellow-500/30">
          <h2 className="text-4xl font-bold text-yellow-400 text-center mb-8">🎰 Lucky 7s 🎰</h2>
          
          {/* Reels */}
          <div className="grid grid-cols-5 gap-3 mb-8 bg-black/50 p-6 rounded-2xl border-2 border-teal-400">
            {reels.map((column, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-2">
                {column.map((symbol, rowIndex) => {
                  const isWinning = winningPositions.some(pos => pos.col === colIndex && pos.row === rowIndex);
                  return (
                    <div
                      key={`${colIndex}-${rowIndex}`}
                      className={`w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-teal-400 rounded-xl flex items-center justify-center text-4xl transition-all duration-300 ${
                        isSpinning ? 'animate-spin' : ''
                      } ${isWinning ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 border-red-400 scale-110 shadow-lg shadow-yellow-400/60' : ''}`}
                    >
                      {symbol}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="text-center space-y-6">
            {/* Bet Controls */}
            <div className="flex flex-wrap justify-center items-center gap-4">
              <span className="text-green-400 font-bold text-lg">Bet Amount:</span>
              {[10, 25, 50, 100].map(amount => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  disabled={isSpinning}
                  className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                    currentBet === amount
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900'
                      : 'bg-gradient-to-r from-teal-400 to-teal-500 text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-400/50'
                  } disabled:opacity-50`}
                >
                  ${amount}
                </button>
              ))}
              <span className="text-yellow-400 text-xl font-bold">
                Current Bet: ${currentBet}
              </span>
            </div>

            {/* Spin Button */}
            <button
              onClick={spin}
              disabled={isSpinning || userData.chips < currentBet}
              className="px-12 py-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-2xl rounded-2xl uppercase tracking-wider transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
            >
              {isSpinning ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Spinning...
                </span>
              ) : (
                '🎰 SPIN THE REELS 🎰'
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
            </button>

            {/* Result Message */}
            {resultMessage && (
              <div className={`p-6 rounded-2xl font-bold text-xl text-center transition-all duration-300 ${
                resultType === 'win' ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50' :
                resultType === 'jackpot' ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50 animate-pulse' :
                resultType === 'lose' ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50' :
                'bg-teal-500/20 text-teal-400 border-2 border-teal-500/50'
              }`}>
                {resultMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
