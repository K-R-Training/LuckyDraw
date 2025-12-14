import React from 'react';
import { Prize } from '../types';

interface PrizeItemProps {
  prize: Prize;
  onRemove?: (id: string) => void;
  isWinnerDisplay?: boolean;
}

export const PrizeItem: React.FC<PrizeItemProps> = ({ prize, onRemove, isWinnerDisplay = false }) => {
  return (
    <div className={`
      relative group flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300
      ${isWinnerDisplay 
        ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 shadow-md' 
        : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100'
      }
    `}>
      <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
        {prize.imageUrl ? (
          <img src={prize.imageUrl} alt={prize.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold truncate ${isWinnerDisplay ? 'text-indigo-900 text-lg' : 'text-slate-800'}`}>
          {prize.name}
        </h3>
        {isWinnerDisplay && prize.winner && (
          <div className="flex items-center gap-2 text-indigo-600 mt-1">
            <span className="text-xs font-bold uppercase tracking-wider bg-indigo-100 px-2 py-0.5 rounded-full">Winner</span>
            <span className="font-bold truncate">{prize.winner}</span>
          </div>
        )}
      </div>

      {onRemove && (
        <button 
          onClick={() => onRemove(prize.id)}
          className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 transition-all"
          title="Remove prize"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </div>
  );
};