import React, { useState, useEffect, useRef } from 'react';
import { Prize } from '../types';
import { Button } from './Button';
import confetti from 'canvas-confetti';

interface DrawingViewProps {
  participants: string[];
  prizes: Prize[];
  onFinish: (prizesWithWinners: Prize[]) => void;
  onBack: () => void;
  isBatchMode: boolean;
}

export const DrawingView: React.FC<DrawingViewProps> = ({
  participants,
  prizes,
  onFinish,
  onBack,
  isBatchMode
}) => {
  // --- STANDARD MODE STATE ---
  const [activePrizeId, setActivePrizeId] = useState<string | null>(null);
  const [winners, setWinners] = useState<Prize[]>([]);
  const [availableParticipants, setAvailableParticipants] = useState<string[]>([...participants]);
  
  // Rolling state for single prize
  const [displayedName, setDisplayedName] = useState('...');
  const [isRolling, setIsRolling] = useState(false);
  const rollingIntervalRef = useRef<number | null>(null);

  // --- BATCH MODE STATE (GIFT EXCHANGE) ---
  const [batchRevealed, setBatchRevealed] = useState(false);
  const [isBatchShuffling, setIsBatchShuffling] = useState(false);

  // Computed
  const allFinished = winners.length === prizes.length;
  const activePrize = prizes.find(p => p.id === activePrizeId);
  const activeWinner = winners.find(w => w.id === activePrizeId);

  useEffect(() => {
    return () => {
      if (rollingIntervalRef.current) clearInterval(rollingIntervalRef.current);
    };
  }, []);

  // ----------------------------------------------------------------
  // BATCH MODE LOGIC (GIFT EXCHANGE)
  // ----------------------------------------------------------------
  const startBatchDraw = () => {
    setIsBatchShuffling(true);
    
    // Simulate thinking/shuffling time
    setTimeout(() => {
        // Logic: Create winners mapping
        // Prizes in this mode are numbers #1, #2, #3...
        // We just need to shuffle the participants and assign.
        
        const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);
        const newWinners: Prize[] = [];

        prizes.forEach((prize, index) => {
            if (index < shuffledParticipants.length) {
                newWinners.push({
                    ...prize,
                    winner: shuffledParticipants[index]
                });
            }
        });

        setWinners(newWinners);
        setIsBatchShuffling(false);
        setBatchRevealed(true);

        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#ec4899', '#f43f5e', '#8b5cf6']
        });

    }, 2000);
  };

  // ----------------------------------------------------------------
  // STANDARD MODE LOGIC
  // ----------------------------------------------------------------
  const handleSelectPrize = (id: string) => {
    if (winners.find(w => w.id === id)) return;
    setActivePrizeId(id);
    setDisplayedName('...'); 
  };

  const startRolling = () => {
    if (isRolling || activeWinner || !activePrize) return;
    if (availableParticipants.length === 0) {
        alert("No participants left!");
        return;
    }

    setIsRolling(true);
    
    rollingIntervalRef.current = window.setInterval(() => {
      const randomIdx = Math.floor(Math.random() * availableParticipants.length);
      setDisplayedName(availableParticipants[randomIdx]);
    }, 50);

    setTimeout(stopRolling, 3000);
  };

  const stopRolling = () => {
    if (rollingIntervalRef.current) {
      clearInterval(rollingIntervalRef.current);
      rollingIntervalRef.current = null;
    }

    if (availableParticipants.length === 0) return;

    const winnerIndex = Math.floor(Math.random() * availableParticipants.length);
    const winnerName = availableParticipants[winnerIndex];
    setDisplayedName(winnerName);

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#a855f7', '#ec4899', '#facc15']
    });

    if (activePrize) {
        const newWinnerEntry = { ...activePrize, winner: winnerName };
        setWinners(prev => [...prev, newWinnerEntry]);
        
        setAvailableParticipants(prev => {
            const newArr = [...prev];
            newArr.splice(winnerIndex, 1);
            return newArr;
        });
    }

    setIsRolling(false);
  };

  const handleBackToList = () => {
    setActivePrizeId(null);
    setDisplayedName('...');
  };

  // ----------------------------------------------------------------
  // RENDER: BATCH MODE (GIFT EXCHANGE)
  // ----------------------------------------------------------------
  if (isBatchMode) {
      return (
        <div className="w-full max-w-5xl mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
             <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-slate-800 mb-2">🎁 Gift Exchange Numbers</h2>
                <p className="text-slate-500">Ready to assign numbers to all participants?</p>
             </div>

             {!batchRevealed ? (
                 <div className="text-center space-y-8">
                     <div className={`text-9xl transition-all duration-500 ${isBatchShuffling ? 'animate-bounce opacity-50' : ''}`}>
                        🎲
                     </div>
                     <Button 
                        onClick={startBatchDraw} 
                        disabled={isBatchShuffling}
                        className="bg-pink-600 hover:bg-pink-700 shadow-pink-200 text-xl px-12 py-4 rounded-2xl"
                     >
                        {isBatchShuffling ? 'Shuffling...' : 'Shuffle & Reveal All'}
                     </Button>
                     <div className="block mt-4">
                         <button onClick={onBack} className="text-slate-400 text-sm hover:underline">Cancel</button>
                     </div>
                 </div>
             ) : (
                 <div className="w-full">
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
                         {winners.map((result) => (
                             <div key={result.id} className="bg-white rounded-xl p-4 shadow-lg border border-pink-100 flex flex-col items-center animate-[fadeIn_0.5s_ease-out]">
                                 <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xl mb-3">
                                     {result.name.replace('No. ', '')}
                                 </div>
                                 <div className="font-bold text-slate-800 text-lg text-center truncate w-full">
                                     {result.winner}
                                 </div>
                             </div>
                         ))}
                     </div>
                     <div className="flex justify-center gap-4">
                        <Button onClick={() => onFinish(winners)} variant="primary" className="bg-pink-600 hover:bg-pink-700">
                            Finish & Save
                        </Button>
                     </div>
                 </div>
             )}
        </div>
      );
  }

  // ----------------------------------------------------------------
  // RENDER: LIST VIEW (STANDARD DASHBOARD)
  // ----------------------------------------------------------------
  if (!activePrizeId) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 flex flex-col h-full">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <div className="text-center sm:text-left">
                <h2 className="text-3xl font-bold text-slate-800">Prize Pool</h2>
                <p className="text-slate-500">Select a prize to draw the winner</p>
            </div>
            <div className="flex gap-3">
                 <button onClick={onBack} className="text-slate-400 hover:text-slate-600 px-4 font-medium transition-colors">
                    Cancel Draw
                 </button>
                 {allFinished ? (
                     <Button onClick={() => onFinish(winners)} className="animate-bounce">
                        Show Final Results
                     </Button>
                 ) : (
                    <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-semibold">
                       {prizes.length - winners.length} prizes left
                    </div>
                 )}
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {prizes.map(prize => {
                const winner = winners.find(w => w.id === prize.id);
                return (
                    <div 
                        key={prize.id}
                        onClick={() => !winner && handleSelectPrize(prize.id)}
                        className={`
                            relative group rounded-2xl overflow-hidden border transition-all duration-300
                            ${winner 
                                ? 'bg-slate-50 border-indigo-200 opacity-90' 
                                : 'bg-white border-slate-200 hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 cursor-pointer'
                            }
                        `}
                    >
                        {/* Card Image */}
                        <div className="aspect-video bg-slate-100 relative overflow-hidden">
                            {prize.imageUrl ? (
                                <img src={prize.imageUrl} alt={prize.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">🎁</div>
                            )}
                            
                            {/* Winner Overlay */}
                            {winner && (
                                <div className="absolute inset-0 bg-indigo-900/60 flex items-center justify-center backdrop-blur-[1px]">
                                    <div className="text-center">
                                        <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Winner</p>
                                        <span className="bg-white text-indigo-700 px-4 py-1.5 rounded-full font-bold shadow-lg block">
                                            {winner.winner}
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Hover Action for Available Prizes */}
                            {!winner && (
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <span className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all bg-white text-slate-900 font-semibold px-4 py-2 rounded-full shadow-lg">
                                        Draw Now
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        {/* Card Footer */}
                        <div className="p-4">
                            <h3 className={`font-bold truncate mb-1 ${winner ? 'text-indigo-900' : 'text-slate-800'}`}>
                                {prize.name}
                            </h3>
                            {winner ? (
                                <div className="flex items-center gap-2 text-indigo-600 text-sm">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span className="font-medium">Complete</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-slate-400 group-hover:text-indigo-500 transition-colors text-sm">
                                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                    <span className="font-medium">Ready to start</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // RENDER: SINGLE DRAWING VIEW (STANDARD)
  // ----------------------------------------------------------------
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl mx-auto p-6">
      <div className="w-full max-w-md">
        <button 
            onClick={handleBackToList}
            className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors group"
        >
            <div className="p-1 rounded-full bg-slate-100 group-hover:bg-slate-200 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
            </div>
            <span className="font-medium">Back to Prize List</span>
        </button>

        <div className="relative w-full bg-white rounded-3xl shadow-2xl shadow-indigo-200 overflow-hidden transform transition-all">
            {/* Image Area */}
            <div className="relative h-64 bg-slate-100 flex items-center justify-center overflow-hidden">
            {activePrize?.imageUrl ? (
                <>
                <img src={activePrize.imageUrl} alt={activePrize.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60"></div>
                </>
            ) : (
                <div className="text-6xl">🎁</div>
            )}
            
            <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-sm font-medium opacity-90 uppercase tracking-widest mb-1">Drawing For</p>
                <h2 className="text-3xl font-bold truncate drop-shadow-md">{activePrize?.name}</h2>
            </div>
            </div>

            {/* Action Area */}
            <div className="p-8 text-center bg-white relative z-10">
            <div className="mb-8 min-h-[4rem] flex items-center justify-center">
                <span className={`text-4xl font-extrabold transition-all ${isRolling ? 'text-slate-400 blur-[1px]' : 'text-indigo-600 scale-110'}`}>
                {displayedName}
                </span>
            </div>

            {!activeWinner ? (
                <Button 
                onClick={startRolling} 
                disabled={isRolling}
                className="w-full py-4 text-lg shadow-indigo-300"
                >
                {isRolling ? 'Drawing...' : 'Draw Winner!'}
                </Button>
            ) : (
                <Button 
                onClick={handleBackToList} 
                variant="secondary"
                className="w-full py-4 text-lg border-indigo-200 text-indigo-700 bg-indigo-50"
                >
                Pick Next Prize
                </Button>
            )}
            </div>
        </div>
      </div>
    </div>
  );
};