import React, { useEffect } from 'react';
import { Prize } from '../types';
import { Button } from './Button';
import { PrizeItem } from './PrizeItem';
import confetti from 'canvas-confetti';

interface ResultsViewProps {
  winners: Prize[];
  onReset: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ winners, onReset }) => {
  
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#6366f1', '#ec4899']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#6366f1', '#ec4899']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-8">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-slate-900 mb-2">🎉 Congratulations! 🎉</h2>
        <p className="text-slate-500">Here are the lucky winners.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-6 sm:p-8 mb-8">
        <div className="space-y-4">
          {winners.map((prize) => (
            <PrizeItem key={prize.id} prize={prize} isWinnerDisplay={true} />
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <Button onClick={onReset} className="min-w-[200px]">
          Start New Draw
        </Button>
      </div>
    </div>
  );
};