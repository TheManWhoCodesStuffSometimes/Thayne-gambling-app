'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserData {
  username: string;
  chips: number;
  userId: string;
  loginTime: string;
}

interface LotteryTicket {
  id: string;
  numbers: number[];
  cost: number;
  timestamp: Date;
}

interface DrawResult {
  winningNumbers: number[];
  bonusNumber: number;
  timestamp: Date;
  prizes: {
    match6: number;
    match5: number;
    match4: number;
    match3: number;
  };
}

interface SessionStats {
  totalTickets: number;
  totalSpent: number;
  totalWon: number;
  biggestWin: number;
  ticketsWon: number;
  sessionStart: Date;
}

export default function LotteryPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [tickets, setTickets] = useState<LotteryTicket[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastDraw, setLastDraw] = useState<DrawResult | null>(null);
  const [ticketPrice] = useState(50);
  const [showResults, setShowResults] = useState(false);
  const [winAnimation, setWinAnimation] = useState<{show: boolean, amount: number, type: string}>({show: false, amount: 0, type: ''});
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalTickets: 0,
    totalSpent: 0,
    totalWon: 0,
    biggestWin: 0,
    ticketsWon: 0,
    sessionStart: new Date()
  });

  useEffect(() => {
    // Get user data from sessionStorage
    const stored = sessionStorage.getItem('casinoUser');
    if (stored) {
      setUserData(JSON.parse(stored));
    } else {
      alert('🚫 No active session found. Redirecting to login...');
      router.push('/');
    }

    // Initialize with sample draw
    setLastDraw({
      winningNumbers: [7, 15, 23, 31, 42, 49],
      bonusNumber: 13,
      timestamp: new Date(),
      prizes: {
        match6: 1000000,
        match5: 50000,
        match4: 1000,
        match3: 100
      }
    });
  }, [router]);

  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else if (selectedNumbers.length < 6) {
      setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
    }
  };

  const quickPick = () => {
    const numbers: number[] = [];
    while (numbers.length < 6) {
      const num = Math.floor(Math.random() * 49) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    setSelectedNumbers(numbers.sort((a, b) => a - b));
  };

  const clearNumbers = () => {
    setSelectedNumbers([]);
  };

  const buyTicket = () => {
    if (!userData || selectedNumbers.length !== 6 || userData.chips < ticketPrice) {
      if (userData && userData.chips < ticketPrice) {
        alert('💸 Not enough chips! You need $50 to buy a lottery ticket.');
        return;
      }
      if (selectedNumbers.length !== 6) {
        alert('🎯 Please select exactly 6 numbers to buy a ticket!');
        return;
      }
      return;
    }

    // Deduct ticket cost
    const newBalance = userData.chips - ticketPrice;
    setUserData(prev => prev ? { ...prev, chips: newBalance } : null);
    sessionStorage.setItem('casinoUser', JSON.stringify({
      ...userData,
      chips: newBalance
    }));

    // Create ticket
    const newTicket: LotteryTicket = {
      id: `ticket_${Date.now()}`,
      numbers: [...selectedNumbers],
      cost: ticketPrice,
      timestamp: new Date()
    };

    setTickets(prev => [...prev, newTicket]);
    setSessionStats(prev => ({
      ...prev,
      totalTickets: prev.totalTickets + 1,
      totalSpent: prev.totalSpent + ticketPrice
    }));

    // Clear selection
    setSelectedNumbers([]);
    
    alert(`🎟️ Ticket purchased!\nNumbers: ${newTicket.numbers.join(', ')}\nCost: $${ticketPrice}\n\nGood luck! 🍀`);
  };

  const drawLottery = () => {
    if (tickets.length === 0) {
      alert('🎟️ You need to buy at least one ticket to play the draw!');
      return;
    }

    setIsDrawing(true);
    setShowResults(false);

    // Simulate dramatic draw animation
    setTimeout(() => {
      // Generate winning numbers
      const winningNumbers: number[] = [];
      while (winningNumbers.length < 6) {
        const num = Math.floor(Math.random() * 49) + 1;
        if (!winningNumbers.includes(num)) {
          winningNumbers.push(num);
        }
      }
      winningNumbers.sort((a, b) => a - b);
      
      const bonusNumber = Math.floor(Math.random() * 49) + 1;

      // Enhanced prizes for better player experience
      const newDraw: DrawResult = {
        winningNumbers,
        bonusNumber,
        timestamp: new Date(),
        prizes: {
          match6: 2000000,
          match5: 75000,
          match4: 2000,
          match3: 150
        }
      };

      setLastDraw(newDraw);

      // Check all tickets for wins
      let totalWinnings = 0;
      let biggestWin = 0;
      let winnersCount = 0;

      tickets.forEach(ticket => {
        const matches = ticket.numbers.filter(num => winningNumbers.includes(num)).length;
        let winAmount = 0;

        // Enhanced win rates - 60% more generous
        if (matches >= 3) {
          switch (matches) {
            case 6:
              winAmount = newDraw.prizes.match6;
              break;
            case 5:
              winAmount = newDraw.prizes.match5;
              break;
            case 4:
              winAmount = newDraw.prizes.match4;
              break;
            case 3:
              winAmount = newDraw.prizes.match3;
              break;
          }
          
          // 60% bonus to all winnings
          winAmount = Math.floor(winAmount * 1.6);
          
          if (winAmount > 0) {
            totalWinnings += winAmount;
            winnersCount++;
            if (winAmount > biggestWin) {
              biggestWin = winAmount;
            }
          }
        }
      });

      if (totalWinnings > 0) {
        // Update user balance
        const newBalance = (userData?.chips || 0) + totalWinnings;
        setUserData(prev => prev ? { ...prev, chips: newBalance } : null);
        sessionStorage.setItem('casinoUser', JSON.stringify({
          ...userData,
          chips: newBalance
        }));

        // Show win animation
        const winType = biggestWin >= 100000 ? 'JACKPOT' : biggestWin >= 10000 ? 'BIG WIN' : 'WIN';
        setWinAnimation({show: true, amount: totalWinnings, type: winType});
        
        setTimeout(() => {
          setWinAnimation({show: false, amount: 0, type: ''});
        }, 4000);
      }

      // Update session stats
      setSessionStats(prev => ({
        ...prev,
        totalWon: prev.totalWon + totalWinnings,
        biggestWin: Math.max(prev.biggestWin, biggestWin),
        ticketsWon: prev.ticketsWon + winnersCount
      }));

      setIsDrawing(false);
      setShowResults(true);

      // Clear tickets for next round
      setTimeout(() => {
        setTickets([]);
        setShowResults(false);
      }, 10000);

    }, 3000);
  };

  const goBack = () => {
    const sessionDuration = Math.round((new Date().getTime() - sessionStats.sessionStart.getTime()) / 1000 / 60);
    const netResult = sessionStats.totalWon - sessionStats.totalSpent;
    const winRate = sessionStats.totalTickets > 0 ? 
      Math.round((sessionStats.ticketsWon / sessionStats.totalTickets) * 100) : 0;

    const summaryText = `🎟️ LOTTERY SESSION SUMMARY 🎟️\n\n` +
      `⏱️ Session Duration: ${sessionDuration} minutes\n` +
      `🎫 Tickets Purchased: ${sessionStats.totalTickets}\n` +
      `🏆 Winning Tickets: ${sessionStats.ticketsWon}\n` +
      `📊 Win Rate: ${winRate}%\n\n` +
      `💰 Total Won: $${sessionStats.totalWon.toLocaleString()}\n` +
      `💸 Total Spent: $${sessionStats.totalSpent.toLocaleString()}\n` +
      `🎯 Net Result: ${netResult >= 0 ? '+' : ''}$${netResult.toLocaleString()}\n` +
      `🚀 Biggest Win: $${sessionStats.biggestWin.toLocaleString()}\n\n` +
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
          <p className="text-yellow-400 text-xl">Loading lottery...</p>
        </div>
      </div>
    );
  }

  const netResult = sessionStats.totalWon - sessionStats.totalSpent;
  const winRate = sessionStats.totalTickets > 0 ? 
    Math.round((sessionStats.ticketsWon / sessionStats.totalTickets) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white">
      {/* Top Bar */}
      <div className="bg-slate-800/95 backdrop-blur-xl border-b-2 border-purple-500 p-3 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-3">
            <button
              onClick={goBack}
              className="px-4 py-2 bg-teal-400/80 hover:bg-teal-400 rounded-lg font-bold text-sm transition-all duration-300"
            >
              ← Back
            </button>
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-purple-400">🎟️ Lucky Lottery</h1>
            </div>
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 rounded-full border-2 border-yellow-500 font-bold">
              💰 ${userData.chips.toLocaleString()}
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="text-green-400 font-medium">Playing: {userData.username}</div>
            <div className="text-purple-300">Ticket Price: $50</div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Win Animation */}
        {winAnimation.show && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/50">
            <div className="text-center animate-bounce">
              <div className={`text-6xl md:text-8xl font-black mb-4 ${
                winAnimation.type === 'JACKPOT' ? 'text-yellow-400' : 
                winAnimation.type === 'BIG WIN' ? 'text-purple-400' : 'text-green-400'
              }`}>
                🎉 {winAnimation.type}! 🎉
              </div>
              <div className="text-4xl md:text-6xl font-bold text-white">
                +${winAnimation.amount.toLocaleString()}
              </div>
              <div className="text-xl text-purple-300 mt-4">
                {winAnimation.type === 'JACKPOT' ? '💎 LIFE CHANGING WIN! 💎' : 
                 winAnimation.type === 'BIG WIN' ? '🚀 INCREDIBLE LUCK! 🚀' : '🍀 LUCKY WINNER! 🍀'}
              </div>
            </div>
          </div>
        )}

        {/* Session Stats */}
        <div className="bg-slate-800/90 border-2 border-purple-400 rounded-2xl p-4 mb-6 grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="text-center p-2 bg-white/5 rounded-lg">
            <div className="text-purple-400 text-xs uppercase tracking-wide mb-1">Tickets</div>
            <div className="text-yellow-400 text-lg font-bold">{sessionStats.totalTickets}</div>
          </div>
          <div className="text-center p-2 bg-white/5 rounded-lg">
            <div className="text-purple-400 text-xs uppercase tracking-wide mb-1">Won</div>
            <div className="text-green-400 text-lg font-bold">{sessionStats.ticketsWon}</div>
          </div>
          <div className="text-center p-2 bg-white/5 rounded-lg">
            <div className="text-purple-400 text-xs uppercase tracking-wide mb-1">Rate</div>
            <div className="text-yellow-400 text-lg font-bold">{winRate}%</div>
          </div>
          <div className="text-center p-2 bg-white/5 rounded-lg">
            <div className="text-purple-400 text-xs uppercase tracking-wide mb-1">Net</div>
            <div className={`text-lg font-bold ${netResult >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${netResult.toLocaleString()}
            </div>
          </div>
          <div className="text-center p-2 bg-white/5 rounded-lg">
            <div className="text-purple-400 text-xs uppercase tracking-wide mb-1">Best</div>
            <div className="text-green-400 text-lg font-bold">${sessionStats.biggestWin.toLocaleString()}</div>
          </div>
        </div>

        {/* Last Draw Results */}
        {lastDraw && (
          <div className="bg-slate-800/95 border-2 border-yellow-500 rounded-2xl p-6 mb-6">
            <h3 className="text-2xl font-bold text-yellow-400 text-center mb-4">🏆 Latest Draw Results</h3>
            <div className="text-center mb-4">
              <div className="flex justify-center items-center gap-2 mb-2">
                <span className="text-purple-300 font-bold">Winning Numbers:</span>
                {lastDraw.winningNumbers.map((num, index) => (
                  <div key={index} className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-900 rounded-full flex items-center justify-center font-bold text-lg">
                    {num}
                  </div>
                ))}
              </div>
              <div className="flex justify-center items-center gap-2">
                <span className="text-purple-300 font-bold">Bonus:</span>
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {lastDraw.bonusNumber}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white/5 p-3 rounded-lg">
                <div className="text-yellow-400 font-bold">6 Numbers</div>
                <div className="text-green-400 text-lg">${lastDraw.prizes.match6.toLocaleString()}</div>
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <div className="text-yellow-400 font-bold">5 Numbers</div>
                <div className="text-green-400 text-lg">${lastDraw.prizes.match5.toLocaleString()}</div>
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <div className="text-yellow-400 font-bold">4 Numbers</div>
                <div className="text-green-400 text-lg">${lastDraw.prizes.match4.toLocaleString()}</div>
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <div className="text-yellow-400 font-bold">3 Numbers</div>
                <div className="text-green-400 text-lg">${lastDraw.prizes.match3.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Number Selection */}
        <div className="bg-slate-800/95 border-2 border-purple-500 rounded-2xl p-6 mb-6">
          <h3 className="text-2xl font-bold text-purple-400 text-center mb-6">🎯 Pick Your Lucky Numbers</h3>
          
          {/* Selected numbers display */}
          <div className="text-center mb-6">
            <div className="text-yellow-400 font-bold mb-2">Selected Numbers ({selectedNumbers.length}/6):</div>
            <div className="flex justify-center items-center gap-2 mb-4">
              {[...selectedNumbers, ...Array(6 - selectedNumbers.length)].map((num, index) => (
                <div key={index} className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 ${
                  num ? 'bg-gradient-to-br from-purple-400 to-purple-600 text-white border-purple-300' : 'bg-slate-700 text-slate-500 border-slate-600'
                }`}>
                  {num || '?'}
                </div>
              ))}
            </div>
            
            {/* Quick controls */}
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={quickPick}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl font-bold transition-all duration-300 hover:-translate-y-1"
              >
                🍀 Quick Pick
              </button>
              <button
                onClick={clearNumbers}
                className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 rounded-xl font-bold transition-all duration-300 hover:-translate-y-1"
              >
                🗑️ Clear All
              </button>
            </div>
          </div>

          {/* Number grid */}
          <div className="grid grid-cols-7 gap-2 md:gap-3 mb-6">
            {Array.from({length: 49}, (_, i) => i + 1).map(num => (
              <button
                key={num}
                onClick={() => toggleNumber(num)}
                disabled={selectedNumbers.length >= 6 && !selectedNumbers.includes(num)}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full font-bold text-sm md:text-base transition-all duration-300 hover:-translate-y-1 ${
                  selectedNumbers.includes(num)
                    ? 'bg-gradient-to-br from-purple-400 to-purple-600 text-white border-2 border-purple-300 scale-110'
                    : 'bg-slate-700 hover:bg-slate-600 text-white border-2 border-slate-600 hover:border-purple-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Buy ticket button */}
          <div className="text-center">
            <button
              onClick={buyTicket}
              disabled={selectedNumbers.length !== 6 || userData.chips < ticketPrice}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold text-xl rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              🎟️ Buy Ticket - $50
            </button>
            {selectedNumbers.length !== 6 && (
              <p className="text-red-400 text-sm mt-2">Select exactly 6 numbers to buy a ticket</p>
            )}
            {userData.chips < ticketPrice && (
              <p className="text-red-400 text-sm mt-2">Not enough chips! Need $50</p>
            )}
          </div>
        </div>

        {/* Current Tickets */}
        {tickets.length > 0 && (
          <div className="bg-slate-800/95 border-2 border-green-500 rounded-2xl p-6 mb-6">
            <h3 className="text-2xl font-bold text-green-400 text-center mb-4">🎫 Your Tickets ({tickets.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.map((ticket, index) => (
                <div key={ticket.id} className="bg-white/5 border border-green-400/30 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-green-400 font-bold">Ticket #{index + 1}</span>
                    <span className="text-yellow-400 font-bold">${ticket.cost}</span>
                  </div>
                  <div className="flex gap-1 mb-2">
                    {ticket.numbers.map((num, numIndex) => (
                      <div key={numIndex} className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 text-slate-900 rounded-full flex items-center justify-center font-bold text-sm">
                        {num}
                      </div>
                    ))}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {ticket.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Draw Section */}
        <div className="bg-slate-800/95 border-2 border-yellow-500 rounded-2xl p-6 text-center">
          <h3 className="text-2xl font-bold text-yellow-400 mb-6">🎲 Ready to Draw?</h3>
          
          {isDrawing ? (
            <div className="py-8">
              <div className="text-6xl mb-4 animate-spin">🎟️</div>
              <div className="text-2xl text-yellow-400 font-bold mb-4">Drawing Numbers...</div>
              <div className="flex justify-center gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center animate-bounce" style={{animationDelay: `${i * 0.1}s`}}>
                    <div className="text-slate-900 font-bold animate-spin">?</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={drawLottery}
                disabled={tickets.length === 0}
                className="px-12 py-6 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-bold text-2xl rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                🎰 DRAW LOTTERY 🎰
              </button>
              {tickets.length === 0 && (
                <p className="text-red-400 text-lg mt-4">Buy at least one ticket to play!</p>
              )}
              {tickets.length > 0 && (
                <p className="text-green-400 text-lg mt-4">
                  Ready to draw with {tickets.length} ticket{tickets.length > 1 ? 's' : ''}! 🍀
                </p>
              )}
            </div>
          )}
        </div>

        {/* Results Section */}
        {showResults && lastDraw && (
          <div className="bg-slate-800/95 border-2 border-green-500 rounded-2xl p-6 mt-6 animate-pulse-glow">
            <h3 className="text-2xl font-bold text-green-400 text-center mb-6">🎉 Draw Results!</h3>
            
            <div className="text-center mb-6">
              <div className="text-yellow-400 font-bold text-xl mb-4">Winning Numbers:</div>
              <div className="flex justify-center gap-2 mb-4">
                {lastDraw.winningNumbers.map((num, index) => (
                  <div key={index} className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-900 rounded-full flex items-center justify-center font-bold text-lg animate-bounce" style={{animationDelay: `${index * 0.2}s`}}>
                    {num}
                  </div>
                ))}
              </div>
            </div>

            {/* Check each ticket */}
            <div className="space-y-4">
              {tickets.map((ticket, index) => {
                const matches = ticket.numbers.filter(num => lastDraw.winningNumbers.includes(num));
                const matchCount = matches.length;
                let winAmount = 0;
                
                if (matchCount >= 3) {
                  switch (matchCount) {
                    case 6: winAmount = Math.floor(lastDraw.prizes.match6 * 1.6); break;
                    case 5: winAmount = Math.floor(lastDraw.prizes.match5 * 1.6); break;
                    case 4: winAmount = Math.floor(lastDraw.prizes.match4 * 1.6); break;
                    case 3: winAmount = Math.floor(lastDraw.prizes.match3 * 1.6); break;
                  }
                }

                return (
                  <div key={ticket.id} className={`border-2 rounded-xl p-4 ${
                    winAmount > 0 ? 'border-green-400 bg-green-500/10' : 'border-gray-500 bg-gray-500/10'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold">Ticket #{index + 1}</span>
                      <span className={`font-bold text-lg ${winAmount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {winAmount > 0 ? `+${winAmount.toLocaleString()}` : 'No Win'}
                      </span>
                    </div>
                    <div className="flex gap-1 mb-2">
                      {ticket.numbers.map((num, numIndex) => (
                        <div key={numIndex} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          matches.includes(num) ? 'bg-gradient-to-br from-green-400 to-green-600 text-slate-900' : 'bg-gray-600 text-white'
                        }`}>
                          {num}
                        </div>
                      ))}
                    </div>
                    <div className="text-sm">
                      {matchCount > 0 ? `${matchCount} matches` : 'No matches'}
                      {winAmount > 0 && <span className="text-green-400 font-bold ml-2">🎉 WINNER!</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.3); }
          50% { box-shadow: 0 0 40px rgba(34, 197, 94, 0.6); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
