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

const WHEEL_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#84cc16', // lime-500
  '#10b981', // emerald-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#d946ef', // fuchsia-500
  '#f43f5e', // rose-500
];

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
  
  // Wheel State
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [currentWinnerName, setCurrentWinnerName] = useState('');

  // --- BATCH MODE STATE ---
  const [batchRevealed, setBatchRevealed] = useState(false);
  const [isBatchShuffling, setIsBatchShuffling] = useState(false);

  // Computed
  const allFinished = winners.length === prizes.length;
  const activePrize = prizes.find(p => p.id === activePrizeId);
  
  // ----------------------------------------------------------------
  // BATCH MODE LOGIC
  // ----------------------------------------------------------------
  const startBatchDraw = () => {
    setIsBatchShuffling(true);
    setTimeout(() => {
        const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);
        const newWinners: Prize[] = [];

        prizes.forEach((prize, index) => {
            if (index < shuffledParticipants.length) {
                newWinners.push({ ...prize, winner: shuffledParticipants[index] });
            }
        });

        setWinners(newWinners);
        setIsBatchShuffling(false);
        setBatchRevealed(true);
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
    }, 2000);
  };

  // ----------------------------------------------------------------
  // STANDARD WHEEL LOGIC
  // ----------------------------------------------------------------
  const handleSelectPrize = (id: string) => {
    if (winners.find(w => w.id === id)) return;
    setActivePrizeId(id);
    setWheelRotation(0); // Reset rotation for new draw
    setWinnerModalOpen(false);
  };

  const spinWheel = () => {
    if (isSpinning || availableParticipants.length === 0) return;

    setIsSpinning(true);
    
    // 1. Pick a winner randomly
    const winnerIndex = Math.floor(Math.random() * availableParticipants.length);
    const winnerName = availableParticipants[winnerIndex];
    
    // 2. Calculate rotation
    // Each slice is (360 / count) degrees.
    // Index 0 starts at 0 degrees (top, if we adjust container).
    // We want the winner slice to land at the top pointer (270deg or -90deg usually, but let's simplify).
    // Let's assume the wheel starts with index 0 at 0 degrees (3 o'clock).
    // To simplify: CSS rotate(0) = 12 o'clock. 
    // Slices are drawn starting from -90deg visually if we map properly?
    // Let's rely on standard calculation:
    // Slice Angle
    const sliceAngle = 360 / availableParticipants.length;
    // Target is to have the center of winner slice at the pointer (top = 0 deg in our css frame).
    // Center of slice 'i' is at: i * sliceAngle + sliceAngle / 2.
    // We need to rotate the wheel backwards so this point hits 0.
    // New Rotation = Current Rotation + (Number of Spins * 360) + Delta.
    // Delta = 360 - (Center of slice).
    
    // Add extra spins (5 to 8 spins)
    const spins = 5 + Math.floor(Math.random() * 3); 
    const sliceCenter = (winnerIndex * sliceAngle) + (sliceAngle / 2);
    
    // Calculate total rotation needed. 
    // We assume the initial 0 position puts index 0 at the top right? 
    // Let's standardize: Rotate circle so that pointer points to angle 0.
    // If we rotate the div by X degrees. The item at angle -X (or 360-X) will be at top.
    
    const targetRotation = wheelRotation + (spins * 360) + (360 - sliceCenter);
    
    // Slight random offset within the slice to prevent landing on lines, limited to 80% of slice width
    const offset = (Math.random() - 0.5) * (sliceAngle * 0.8);
    
    const finalRotation = targetRotation + offset;

    setWheelRotation(finalRotation);

    // 3. Wait for animation to finish
    // CSS transition is set to 4s cubic-bezier
    setTimeout(() => {
        setIsSpinning(false);
        setCurrentWinnerName(winnerName);
        setWinnerModalOpen(true);
        
        // Confetti
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#ec4899', '#facc15']
        });

        // Save Winner
        if (activePrize) {
            const newWinnerEntry = { ...activePrize, winner: winnerName };
            setWinners(prev => [...prev, newWinnerEntry]);
            
            // Remove from pool
            setAvailableParticipants(prev => {
                const newArr = [...prev];
                newArr.splice(winnerIndex, 1);
                return newArr;
            });
        }
    }, 4000); // Must match CSS duration
  };

  const handleBackToList = () => {
    setActivePrizeId(null);
    setWinnerModalOpen(false);
  };

  // Helper for Wheel SVG path
  const getWheelSlices = () => {
    const total = availableParticipants.length;
    if (total === 0) return null;
    
    const slices = [];
    const radius = 50; // SVG coordinate space 100x100
    const center = 50;
    
    // If only 1 participant, full circle
    if (total === 1) {
        return (
            <g>
                <circle cx={center} cy={center} r={radius} fill={WHEEL_COLORS[0]} />
                <text 
                    x={center} y={center} 
                    fill="white" 
                    fontSize="12" 
                    fontWeight="bold" 
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    transform={`rotate(-90, ${center}, ${center})`}
                >
                    {availableParticipants[0]}
                </text>
            </g>
        );
    }

    for (let i = 0; i < total; i++) {
        const startAngle = (i * 360) / total;
        const endAngle = ((i + 1) * 360) / total;
        
        // Convert to radians, subtract 90deg to start at 12 o'clock
        const startRad = (startAngle - 90) * (Math.PI / 180);
        const endRad = (endAngle - 90) * (Math.PI / 180);
        
        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);
        
        // SVG Path command
        const d = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
        
        // Text position: average angle
        const midAngle = (startAngle + endAngle) / 2;
        const midRad = (midAngle - 90) * (Math.PI / 180);
        // Place text at 65% radius
        const tx = center + (radius * 0.65) * Math.cos(midRad);
        const ty = center + (radius * 0.65) * Math.sin(midRad);

        slices.push(
            <g key={i}>
                <path d={d} fill={WHEEL_COLORS[i % WHEEL_COLORS.length]} stroke="white" strokeWidth="0.5" />
                <text 
                    x={tx} y={ty} 
                    fill="white" 
                    fontSize={total > 12 ? "4" : total > 8 ? "5" : "7"}
                    fontWeight="bold" 
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    transform={`rotate(${midAngle}, ${tx}, ${ty})`}
                    style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.3)' }}
                >
                    {availableParticipants[i].length > 8 ? availableParticipants[i].substring(0, 8) + '..' : availableParticipants[i]}
                </text>
            </g>
        );
    }
    return slices;
  };

  // ----------------------------------------------------------------
  // RENDER: BATCH MODE
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
  // RENDER: PRIZE POOL (STANDARD)
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
                            
                            {!winner && (
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <span className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all bg-white text-slate-900 font-semibold px-4 py-2 rounded-full shadow-lg">
                                        Draw Now
                                    </span>
                                </div>
                            )}
                        </div>
                        
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
  // RENDER: SINGLE WHEEL DRAW (STANDARD)
  // ----------------------------------------------------------------
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] w-full p-4 overflow-hidden relative">
      
      {/* Back Button */}
      <button 
        onClick={handleBackToList}
        className="absolute top-4 left-4 sm:top-8 sm:left-8 z-20 flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
        <span className="font-medium">Back</span>
      </button>

      {/* Prize Header */}
      <div className="mb-6 text-center z-10 max-w-lg">
          <div className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-2">
            Drawing For
          </div>
          <h2 className="text-3xl font-black text-slate-800 drop-shadow-sm">{activePrize?.name}</h2>
          {activePrize?.imageUrl && (
            <div className="w-20 h-20 mx-auto mt-4 rounded-xl overflow-hidden shadow-lg border-2 border-white">
                <img src={activePrize.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
      </div>

      {/* THE WHEEL CONTAINER */}
      <div className="relative w-[320px] h-[320px] sm:w-[450px] sm:h-[450px]">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20">
            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-slate-800 drop-shadow-xl"></div>
        </div>

        {/* Spinning SVG */}
        <div 
            className="w-full h-full rounded-full shadow-2xl border-4 border-white bg-white overflow-hidden"
            style={{ 
                transform: `rotate(${wheelRotation}deg)`,
                transition: isSpinning ? 'transform 4s cubic-bezier(0.2, 0, 0.2, 1)' : 'none'
            }}
        >
            <svg viewBox="0 0 100 100" className="w-full h-full">
                {getWheelSlices()}
            </svg>
        </div>

        {/* Center Knob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center z-10 border-4 border-slate-100">
            <div className="text-2xl">✨</div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-10 z-10">
        <Button 
            onClick={spinWheel} 
            disabled={isSpinning || availableParticipants.length === 0}
            className="px-12 py-4 text-xl shadow-xl shadow-indigo-200"
        >
            {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
        </Button>
      </div>

      {/* Winner Modal/Overlay */}
      {winnerModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s]">
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center transform scale-110 animate-[bounceIn_0.5s]">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-slate-500 font-medium uppercase tracking-widest text-sm mb-2">The Winner Is</h3>
                <div className="text-4xl font-black text-indigo-600 mb-8 break-words leading-tight">
                    {currentWinnerName}
                </div>
                
                <div className="flex flex-col gap-3">
                    <Button onClick={handleBackToList} className="w-full">
                        Next Prize
                    </Button>
                    <button onClick={() => setWinnerModalOpen(false)} className="text-slate-400 text-sm hover:underline">
                        Close & Stay Here
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};