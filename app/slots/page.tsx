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
  name: string;
}

interface PaylineResult {
  isWin: boolean;
  winnings: number;
  winType: string;
  positions: {col: number, row: number}[];
  lineIndex: number;
}

export default function SlotsPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentBet, setCurrentBet] = useState(25);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultMessage, setResultMessage] = useState('Place your bet and spin to win!');
  const [resultType, setResultType] = useState<'win' | 'lose' | 'jackpot' | ''>('');
  const [jackpotAmount, setJackpotAmount] = useState(5000);
  const [diamondAnimation, setDiamondAnimation] = useState<{col: number, row: number}[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalGames: 0,
    totalWins: 0,
    totalLosses: 0,
    totalWinAmount: 0,
    totalLossAmount: 0,
    biggestWin: 0,
    sessionStart: new Date()
  });

  // Enhanced symbols with treasure theme
  const symbols: Symbol[] = [
    { emoji: '🍎', weight: 25, value: 1, name: 'Apple' },
    { emoji: '🪙', weight: 20, value: 2, name: 'Coin' },
    { emoji: '💰', weight: 18, value: 3, name: 'Money Bag' },
    { emoji: '💳', weight: 15, value: 4, name: 'Credit Card' },
    { emoji: '👑', weight: 12, value: 6, name: 'Crown' },
    { emoji: '🏆', weight: 8, value: 10, name: 'Trophy' },
    { emoji: '💍', weight: 6, value: 15, name: 'Ring' },
    { emoji: '💎', weight: 4, value: 25, name: 'Diamond' }
  ];

  // Define 9 paylines (all starting from leftmost column)
  const paylines = [
    // Horizontal lines
    [[0,0], [1,0], [2,0], [3,0], [4,0]], // Top row
    [[0,1], [1,1], [2,1], [3,1], [4,1]], // Middle row
    [[0,2], [1,2], [2,2], [3,2], [4,2]], // Bottom row
    // Diagonal lines
    [[0,0], [1,1], [2,2], [3,1], [4,0]], // V shape
    [[0,2], [1,1], [2,0], [3,1], [4,2]], // ^ shape
    // Zigzag lines
    [[0,0], [1,2], [2,1], [3,2], [4,0]], // W shape
    [[0,2], [1,0], [2,1], [3,0], [4,2]], // M shape
    [[0,1], [1,0], [2,2], [3,0], [4,1]], // Lightning 1
    [[0,1], [1,2], [2,0], [3,2], [4,1]]  // Lightning 2
  ];

  const [reels, setReels] = useState<string[][]>([]);
  const [reelSymbols, setReelSymbols] = useState<string[][]>([]);
  const [winningPositions, setWinningPositions] = useState<{col: number, row: number, lineIndex: number}[]>([]);
  const [winPopup, setWinPopup] = useState<{show: boolean, amount: number}>({show: false, amount: 0});
  const [showPaytable, setShowPaytable] = useState(false);

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

  const generateReelStrip = () => {
    const strip: string[] = [];
    for (let i = 0; i < 20; i++) { // Longer strip for smooth animation
      strip.push(getRandomSymbol().emoji);
    }
    return strip;
  };

  const initializeReels = () => {
    const newReels: string[][] = [];
    const newReelSymbols: string[][] = [];
    
    for (let col = 0; col < 5; col++) {
      const reelStrip = generateReelStrip();
      newReelSymbols.push(reelStrip);
      
      // Show initial 3 symbols
      const visibleSymbols = reelStrip.slice(0, 3);
      newReels.push(visibleSymbols);
    }
    
    setReels(newReels);
    setReelSymbols(newReelSymbols);
  };

  const setBetAmount = (amount: number) => {
    if (isSpinning) return;
    setCurrentBet(amount);
  };

  const recordGameResult = (isWin: boolean, amount: number, betAmount: number, diamondCount: number = 0) => {
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

    // Update jackpot with diamonds
    if (diamondCount > 0) {
      setJackpotAmount(prev => prev + (diamondCount * 100));
    }
  };

  const checkPaylines = (finalReels: Symbol[][]) => {
    let totalWinnings = 0;
    let allWinningPositions: {col: number, row: number, lineIndex: number}[] = [];
    let winTypes: string[] = [];
    let diamondPositions: {col: number, row: number}[] = [];

    // Count diamonds for jackpot contribution
    let diamondCount = 0;
    finalReels.forEach((column, colIndex) => {
      column.forEach((symbol, rowIndex) => {
        if (symbol.emoji === '💎') {
          diamondCount++;
          diamondPositions.push({col: colIndex, row: rowIndex});
        }
      });
    });

    // Check each payline
    paylines.forEach((line, lineIndex) => {
      const lineSymbols = line.map(([col, row]) => finalReels[col][row]);
      const result = checkSinglePayline(lineSymbols, lineIndex, line);
      
      if (result.isWin) {
        totalWinnings += result.winnings;
        winTypes.push(result.winType);
        allWinningPositions = allWinningPositions.concat(
          result.positions.map(pos => ({...pos, lineIndex}))
        );
      }
    });

    // Enhanced payouts for 55% player advantage
    if (totalWinnings > 0) {
      totalWinnings = Math.floor(totalWinnings * 1.4); // 40% bonus to payouts
    }

    return {
      isWin: totalWinnings > 0,
      winnings: totalWinnings,
      winTypes,
      winningPositions: allWinningPositions,
      diamondCount,
      diamondPositions
    };
  };

  const checkSinglePayline = (lineSymbols: Symbol[], lineIndex: number, positions: number[][]) => {
    let consecutiveCount = 1;
    const firstSymbol = lineSymbols[0];
    
    // Count consecutive matching symbols from left
    for (let i = 1; i < lineSymbols.length; i++) {
      if (lineSymbols[i].emoji === firstSymbol.emoji) {
        consecutiveCount++;
      } else {
        break;
      }
    }
    
    // Need at least 3 consecutive symbols to win
    if (consecutiveCount >= 3) {
      const baseWinnings = currentBet * firstSymbol.value;
      let multiplier = 1;
      
      if (consecutiveCount === 4) multiplier = 3;
      else if (consecutiveCount === 5) multiplier = 10;
      
      const winnings = baseWinnings * multiplier;
      const winPositions = positions.slice(0, consecutiveCount).map(([col, row]) => ({col, row}));
      
      return {
        isWin: true,
        winnings,
        winType: firstSymbol.emoji === '💎' ? 'DIAMOND WIN' : 'WIN',
        positions: winPositions
      };
    }
    
    return {
      isWin: false,
      winnings: 0,
      winType: '',
      positions: []
    };
  };

  const animateDiamonds = (positions: {col: number, row: number}[]) => {
    setDiamondAnimation(positions);
    setTimeout(() => {
      setDiamondAnimation([]);
    }, 2000);
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
    setResultMessage('Spinning the reels...');
    setResultType('');
    setWinningPositions([]);

    // Deduct bet amount
    const newBalance = userData.chips - currentBet;
    setUserData(prev => prev ? { ...prev, chips: newBalance } : null);
    
    sessionStorage.setItem('casinoUser', JSON.stringify({
      ...userData,
      chips: newBalance
    }));

    // Generate final results
    const finalResults: Symbol[][] = [];
    for (let col = 0; col < 5; col++) {
      const column: Symbol[] = [];
      for (let row = 0; row < 3; row++) {
        column.push(getRandomSymbol());
      }
      finalResults.push(column);
    }

    // Animate reels spinning
    const spinDuration = 2000;
    const spinInterval = 100;
    let spinCounter = 0;
    
    const spinAnimation = setInterval(() => {
      setReels(prev => {
        return prev.map((reel, colIndex) => {
          // Generate random symbols during spin
          return [
            getRandomSymbol().emoji,
            getRandomSymbol().emoji,
            getRandomSymbol().emoji
          ];
        });
      });
      
      spinCounter++;
      if (spinCounter >= spinDuration / spinInterval) {
        clearInterval(spinAnimation);
        
        // Set final results
        const finalReelsDisplay = finalResults.map(col => col.map(symbol => symbol.emoji));
        setReels(finalReelsDisplay);
        
        // Calculate win
        const result = checkPaylines(finalResults);
        
        if (result.diamondCount > 0) {
          animateDiamonds(result.diamondPositions);
        }
        
        if (result.isWin) {
          const finalBalance = newBalance + result.winnings;
          setUserData(prev => prev ? { ...prev, chips: finalBalance } : null);
          sessionStorage.setItem('casinoUser', JSON.stringify({
            ...userData,
            chips: finalBalance
          }));
          
          // Show win popup
          setWinPopup({show: true, amount: result.winnings});
          setTimeout(() => {
            setWinPopup({show: false, amount: 0});
          }, 2000);
          
          setResultMessage(`${result.winTypes.join(', ')}! You won ${result.winnings}!`);
          setResultType('win');
          setWinningPositions(result.winningPositions);
          recordGameResult(true, result.winnings, currentBet, result.diamondCount);
        } else {
          setResultMessage('No winning combinations. Try again!');
          setResultType('lose');
          recordGameResult(false, 0, currentBet, result.diamondCount);
        }

        setTimeout(() => {
          setIsSpinning(false);
          setWinningPositions([]);
        }, 3000);
      }
    }, spinInterval);
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
      {/* Top Bar - Mobile Optimized */}
      <div className="bg-slate-800/95 backdrop-blur-xl border-b-2 border-yellow-500 p-3 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto">
          {/* Top row - Controls */}
          <div className="flex justify-between items-center mb-3">
            <button
              onClick={goBack}
              className="px-4 py-2 bg-teal-400/80 hover:bg-teal-400 rounded-lg font-bold text-sm transition-all duration-300"
            >
              ← Back
            </button>
            <button
              onClick={() => setShowPaytable(!showPaytable)}
              className="px-4 py-2 bg-purple-600/80 hover:bg-purple-600 rounded-lg font-bold text-sm transition-all duration-300"
            >
              {showPaytable ? 'Hide' : 'Pay'} Table
            </button>
          </div>
          
          {/* Center - Title and Jackpot */}
          <div className="text-center mb-3">
            <h1 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-2">🎰 Diamond Fortune</h1>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-full border-3 border-yellow-400 animate-pulse inline-block">
              <div className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">💎 JACKPOT 💎</div>
              <div className="text-white text-xl md:text-2xl font-black">${jackpotAmount.toLocaleString()}</div>
            </div>
          </div>

          {/* Bottom row - Player info */}
          <div className="flex justify-between items-center text-sm md:text-base">
            <div className="text-green-400 font-medium">Playing: {userData.username}</div>
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 rounded-full border-2 border-yellow-500 font-bold">
              💰 ${userData.chips.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Paytable - Mobile Optimized */}
        {showPaytable && (
          <div className="bg-slate-800/95 border-2 border-purple-500 rounded-2xl p-4 mb-6">
            <h3 className="text-xl font-bold text-purple-400 text-center mb-4">💰 PAYTABLE 💰</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {symbols.map((symbol, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-3 text-center border border-purple-400/30">
                  <div className="text-2xl md:text-3xl mb-1">{symbol.emoji}</div>
                  <div className="text-purple-300 text-xs font-bold mb-1">{symbol.name}</div>
                  <div className="text-yellow-400 text-xs">
                    <div>3: ${symbol.value * currentBet}</div>
                    <div>4: ${symbol.value * currentBet * 3}</div>
                    <div>5: ${symbol.value * currentBet * 10}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-3 text-green-400 text-xs">
              💎 Diamonds contribute to jackpot! • 9 paylines • Must start from left
            </div>
          </div>
        )}

        {/* Stats Panel - Mobile Optimized */}
        <div className="bg-slate-800/90 border-2 border-teal-400 rounded-2xl p-4 mb-6 grid grid-cols-3 md:grid-cols-6 gap-3">
          <div className="text-center p-2 bg-white/5 rounded-lg">
            <div className="text-green-400 text-xs uppercase tracking-wide mb-1">Games</div>
            <div className="text-yellow-400 text-lg font-bold">{sessionStats.totalGames}</div>
          </div>
          <div className="text-center p-2 bg-white/5 rounded-lg">
            <div className="text-green-400 text-xs uppercase tracking-wide mb-1">Wins</div>
            <div className="text-green-400 text-lg font-bold">{sessionStats.totalWins}</div>
          </div>
          <div className="text-center p-2 bg-white/5 rounded-lg">
            <div className="text-green-400 text-xs uppercase tracking-wide mb-1">Rate</div>
            <div className="text-yellow-400 text-lg font-bold">{winRate}%</div>
          </div>
          <div className="text-center p-2 bg-white/5 rounded-lg">
            <div className="text-green-400 text-xs uppercase tracking-wide mb-1">Net</div>
            <div className={`text-lg font-bold ${netWinnings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${netWinnings}
            </div>
          </div>
          <div className="text-center p-2 bg-white/5 rounded-lg">
            <div className="text-green-400 text-xs uppercase tracking-wide mb-1">Best</div>
            <div className="text-green-400 text-lg font-bold">${sessionStats.biggestWin}</div>
          </div>
          <div className="text-center p-2 bg-white/5 rounded-lg">
            <div className="text-green-400 text-xs uppercase tracking-wide mb-1">Loss</div>
            <div className="text-red-400 text-lg font-bold">{sessionStats.totalLosses}</div>
          </div>
        </div>

        {/* Slot Machine - Mobile Optimized */}
        <div className="bg-slate-800/95 border-4 border-yellow-500 rounded-3xl p-4 md:p-8 shadow-2xl shadow-yellow-500/30 relative">
          <h2 className="text-2xl md:text-4xl font-bold text-yellow-400 text-center mb-6">💎 DIAMOND FORTUNE 💎</h2>
          
          {/* Reels - Smaller for mobile */}
          <div className="grid grid-cols-5 gap-2 md:gap-4 mb-6 bg-black/70 p-4 md:p-8 rounded-2xl border-4 border-teal-400 relative overflow-hidden">
            {reels.map((column, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-1 md:gap-2 relative">
                {column.map((symbol, rowIndex) => {
                  const isWinning = winningPositions.some(pos => pos.col === colIndex && pos.row === rowIndex);
                  const isDiamond = symbol === '💎';
                  const isDiamondAnimating = diamondAnimation.some(pos => pos.col === colIndex && pos.row === rowIndex);
                  
                  return (
                    <div
                      key={`${colIndex}-${rowIndex}`}
                      className={`w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-slate-700 to-slate-800 border-2 md:border-3 border-teal-400 rounded-lg md:rounded-xl flex items-center justify-center text-3xl md:text-5xl transition-all duration-500 relative ${
                        isSpinning ? 'animate-bounce' : ''
                      } ${
                        isWinning ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-300 text-yellow-900 animate-spin' : ''
                      } ${
                        isDiamondAnimating ? 'animate-ping bg-gradient-to-br from-purple-400 to-pink-500' : ''
                      }`}
                    >
                      {symbol}
                      {isDiamond && !isSpinning && (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-lg md:rounded-xl animate-pulse"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            
            {/* Diamond fly animation - Adjusted for mobile */}
            {diamondAnimation.map((pos, index) => (
              <div
                key={index}
                className="absolute text-2xl md:text-4xl animate-bounce z-50 pointer-events-none"
                style={{
                  left: `${(pos.col * (window.innerWidth > 768 ? 120 : 72)) + (window.innerWidth > 768 ? 48 : 32)}px`,
                  top: `${(pos.row * (window.innerWidth > 768 ? 100 : 68)) + (window.innerWidth > 768 ? 48 : 32)}px`,
                  animation: 'diamondFly 2s ease-out forwards'
                }}
              >
                💎
              </div>
            ))}
          </div>

          {/* Win Popup */}
          {winPopup.show && (
            <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-900 px-8 py-6 rounded-2xl border-4 border-yellow-300 shadow-2xl shadow-yellow-400/80 animate-bounce">
                <div className="text-center">
                  <div className="text-2xl md:text-4xl font-black mb-2">🎉 WIN! 🎉</div>
                  <div className="text-xl md:text-2xl font-bold">+${winPopup.amount}</div>
                </div>
              </div>
            </div>
          )}

          {/* Controls - Mobile Optimized */}
          <div className="text-center space-y-4">
            {/* Bet Controls */}
            <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4">
              <span className="text-green-400 font-bold text-sm md:text-lg w-full md:w-auto mb-2 md:mb-0">Bet Amount:</span>
              {[10, 25, 50, 100, 250].map(amount => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  disabled={isSpinning}
                  className={`px-3 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl font-bold text-sm md:text-base transition-all duration-300 ${
                    currentBet === amount
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900'
                      : 'bg-gradient-to-r from-teal-400 to-teal-500 text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-400/50'
                  } disabled:opacity-50`}
                >
                  ${amount}
                </button>
              ))}
            </div>
            
            <div className="text-yellow-400 text-lg md:text-xl font-bold">
              Current Bet: ${currentBet}
            </div>

            {/* Spin Button */}
            <button
              onClick={spin}
              disabled={isSpinning || userData.chips < currentBet}
              className="w-full max-w-sm px-8 py-6 md:px-16 md:py-8 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-xl md:text-3xl rounded-2xl uppercase tracking-wider transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
            >
              {isSpinning ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-4 border-white mr-3 md:mr-4"></div>
                  SPINNING...
                </span>
              ) : (
                '🎰 SPIN TO WIN 🎰'
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
            </button>

            {/* Result Message */}
            {resultMessage && (
              <div className={`p-4 md:p-6 rounded-2xl font-bold text-lg md:text-xl text-center transition-all duration-300 ${
                resultType === 'win' ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50 animate-pulse' :
                resultType === 'jackpot' ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50 animate-bounce' :
                resultType === 'lose' ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50' :
                'bg-teal-500/20 text-teal-400 border-2 border-teal-500/50'
              }`}>
                {resultMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes diamondFly {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateY(-100px) scale(1.5);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-200px) scale(0.5);
            opacity: 0;
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
