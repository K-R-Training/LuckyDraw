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
  const spinWheel = () => {
    if (isSpinning || availableParticipants.length === 0) return;

    setIsSpinning(true);
    
    // 1. Pick winner
    const winnerIndex = Math.floor(Math.random() * availableParticipants.length);
    const winnerName = availableParticipants[winnerIndex];
    
    // 2. LEFT SIDE (270 deg) Calibration
    const sliceAngle = 360 / availableParticipants.length;
    const sliceCenter = (winnerIndex + 0.5) * sliceAngle;
    
    // Increased rotations for 8-second long spin (12-20 full rotations)
    const extraSpins = (12 + Math.floor(Math.random() * 8)) * 360;
    
    const currentModulo = wheelRotation % 360;
    const targetBase = 270 - sliceCenter;
    
    // Natural variation within the slice
    const randomOffset = (Math.random() - 0.5) * (sliceAngle * 0.8);
    
    const finalRotation = wheelRotation + extraSpins + (targetBase - currentModulo) + randomOffset;

    setWheelRotation(finalRotation);

    // Duration increased to 8000ms (8 seconds) for maximum suspense
    setTimeout(() => {
        setIsSpinning(false);
        setCurrentWinnerName(winnerName);
        setWinnerModalOpen(true);
        
        confetti({
          particleCount: 200,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#ec4899', '#facc15', '#10b981']
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
    }, 8000); 
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
    const radius = 50; 
    const center = 50;
    
    if (total === 1) {
        return (
            <g>
                <circle cx={center} cy={center} r={radius} fill={WHEEL_COLORS[0]} />
                <text 
                    x={center} y={center} 
                    fill="white" 
                    fontSize="8" 
                    fontWeight="900" 
                    textAnchor="middle" 
                    dominantBaseline="middle"
                >
                    {availableParticipants[0]}
                </text>
            </g>
        );
    }

    for (let i = 0; i < total; i++) {
        const startAngle = (i * 360) / total;
        const endAngle = ((i + 1) * 360) / total;
        
        const startRad = (startAngle - 90) * (Math.PI / 180);
        const endRad = (endAngle - 90) * (Math.PI / 180);
        
        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);
        
        const d = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
        
        const midAngle = (startAngle + endAngle) / 2;
        const midRad = (midAngle - 90) * (Math.PI / 180);
        
        const tx = center + (radius * 0.74) * Math.cos(midRad);
        const ty = center + (radius * 0.74) * Math.sin(midRad);

        slices.push(
            <g key={i}>
                <path d={d} fill={WHEEL_COLORS[i % WHEEL_COLORS.length]} stroke="rgba(255,255,255,0.3)" strokeWidth="0.08" />
                <text 
                    x={tx} y={ty} 
                    fill="white" 
                    fontSize={total > 40 ? "1.8" : total > 20 ? "2.6" : "3.6"}
                    fontWeight="900" 
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                    style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.5)', letterSpacing: '0.01em' }}
                >
                    {availableParticipants[i]}
                </text>
            </g>
        );
    }
    return slices;
  };

  if (isBatchMode) {
      return (
        <div className="w-full max-w-5xl mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
             <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-slate-800 mb-2">🎁 交換禮物分配結果</h2>
                <p className="text-slate-500">系統已完成隨機分配</p>
             </div>

             {!batchRevealed ? (
                 <div className="text-center space-y-8">
                     <div className={`text-9xl transition-all duration-500 ${isBatchShuffling ? 'animate-bounce opacity-50' : ''}`}>🎲</div>
                     <Button 
                        onClick={startBatchDraw} 
                        disabled={isBatchShuffling}
                        className="bg-pink-600 hover:bg-pink-700 shadow-pink-200 text-xl px-12 py-4 rounded-2xl"
                     >
                        {isBatchShuffling ? '分配中...' : '立即開始分配'}
                     </Button>
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
                     <div className="flex justify-center">
                        <Button onClick={() => onFinish(winners)} variant="primary" className="bg-pink-600 hover:bg-pink-700">完成並儲存</Button>
                     </div>
                 </div>
             )}
        </div>
      );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] w-full p-4 overflow-hidden relative bg-slate-50">
      
      {/* Back Button */}
      <button 
        onClick={handleBackToList}
        className="absolute top-4 left-4 sm:top-8 sm:left-8 z-30 flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md text-slate-500 hover:text-indigo-600 transition-all"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
        <span className="font-bold">返回獎項</span>
      </button>

      {/* Prize Header */}
      <div className="mb-10 text-center z-10 max-w-lg">
          <div className="inline-block bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 shadow-lg shadow-indigo-200">
            LUCKY DRAW
          </div>
          <h2 className="text-4xl font-black text-slate-900 drop-shadow-sm">{activePrize?.name}</h2>
          {activePrize?.imageUrl && (
            <div className="w-24 h-24 mx-auto mt-4 rounded-2xl overflow-hidden shadow-2xl border-4 border-white rotate-3">
                <img src={activePrize.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
      </div>

      {/* THE WHEEL CONTAINER */}
      <div className="relative w-[340px] h-[340px] sm:w-[600px] sm:h-[600px] animate-[scaleIn_0.5s_ease-out]">
        
        {/* SLEEK CLOCK HAND POINTER (LEFT SIDE) */}
        <div className="absolute top-1/2 -left-12 sm:-left-20 -translate-y-1/2 z-40 flex items-center">
            <div className="relative">
                <svg width="100" height="40" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_10px_15px_rgba(0,0,0,0.3)]">
                   <path d="M95 20L15 5L5 20L15 35L95 20Z" fill="url(#hand_gradient)" stroke="white" strokeWidth="1.5"/>
                   <path d="M95 20L80 17.5V22.5L95 20Z" fill="white" fillOpacity="0.8"/>
                   <circle cx="10" cy="20" r="8" fill="#1E293B" stroke="white" strokeWidth="1.5"/>
                   <circle cx="10" cy="20" r="3" fill="#6366F1"/>
                   
                   <defs>
                      <linearGradient id="hand_gradient" x1="5" y1="20" x2="95" y2="20" gradientUnits="userSpaceOnUse">
                         <stop stopColor="#0F172A"/>
                         <stop offset="0.5" stopColor="#334155"/>
                         <stop offset="1" stopColor="#0F172A"/>
                      </linearGradient>
                   </defs>
                </svg>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-10 bg-indigo-500/20 blur-xl animate-pulse"></div>
            </div>
        </div>

        {/* Spinning SVG - SUSPENSE ANIMATION (8s duration + steep ease-out) */}
        <div 
            className="w-full h-full rounded-full shadow-[0_0_120px_rgba(99,102,241,0.2)] border-[16px] border-white bg-white overflow-hidden relative ring-1 ring-slate-200"
            style={{ 
                transform: `rotate(${wheelRotation}deg)`,
                // 8 seconds duration with a curve that is very slow at the end (cubic-bezier(0.1, 0, 0, 1))
                transition: isSpinning ? 'transform 8s cubic-bezier(0.1, 0, 0, 1)' : 'none'
            }}
        >
            <svg viewBox="0 0 100 100" className="w-full h-full">
                {getWheelSlices()}
            </svg>
        </div>

        {/* Center Decorative Knob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center justify-center z-20 border-[12px] border-slate-50">
            <div className="text-6xl animate-[bounce_2s_infinite] select-none">🏆</div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-14 z-10 flex flex-col items-center gap-4">
        <Button 
            onClick={spinWheel} 
            disabled={isSpinning || availableParticipants.length === 0}
            className="px-24 py-7 text-3xl font-black shadow-2xl shadow-indigo-300 rounded-2xl transition-all hover:scale-105 active:scale-95 bg-slate-900 hover:bg-indigo-600 group"
        >
            {isSpinning ? '緊張時刻...！' : (
                <span className="flex items-center gap-3">
                    啟動輪盤 <svg className="w-8 h-8 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </span>
            )}
        </Button>
        <div className="flex flex-col items-center gap-1">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
              緩慢停下時請屏息以待
          </p>
          <p className="text-indigo-400 text-[9px] font-bold">中獎者將精準對準左側劍指針</p>
        </div>
      </div>

      {/* Winner Modal */}
      {winnerModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-[fadeIn_0.3s]">
            <div className="bg-white p-12 rounded-[4rem] shadow-[0_40px_120px_rgba(0,0,0,0.6)] max-w-sm w-full text-center transform animate-[scaleIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)] border-t-8 border-indigo-600">
                <div className="text-8xl mb-6 drop-shadow-lg">🎉</div>
                <h3 className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mb-3">CONGRATULATIONS</h3>
                <p className="text-indigo-600 font-bold mb-1">幸運兒降臨</p>
                <div className="text-5xl font-black text-slate-900 mb-12 break-words leading-tight px-2">
                    {currentWinnerName}
                </div>
                
                <div className="flex flex-col gap-3">
                    <Button onClick={handleBackToList} className="w-full py-5 rounded-3xl shadow-xl bg-indigo-600 hover:bg-indigo-700 text-lg">
                        接受榮耀
                    </Button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};