import React, { useState } from 'react';
import { Prize, AppMode } from '../types';
import { Button } from './Button';
import { PrizeItem } from './PrizeItem';
import { generatePrizeImage } from '../services/geminiService';

interface SetupViewProps {
  participants: string;
  setParticipants: (val: string) => void;
  prizes: Prize[];
  setPrizes: React.Dispatch<React.SetStateAction<Prize[]>>;
  onStartDraw: () => void;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
}

export const SetupView: React.FC<SetupViewProps> = ({
  participants,
  setParticipants,
  prizes,
  setPrizes,
  onStartDraw,
  appMode,
  setAppMode
}) => {
  const [newPrizeName, setNewPrizeName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const addPrize = () => {
    if (!newPrizeName.trim()) return;
    const newPrize: Prize = {
      id: crypto.randomUUID(),
      name: newPrizeName.trim(),
    };
    setPrizes(prev => [...prev, newPrize]);
    setNewPrizeName('');
  };

  const removePrize = (id: string) => {
    setPrizes(prev => prev.filter(p => p.id !== id));
  };

  const generateImages = async () => {
    setIsGenerating(true);
    const prizesWithoutImages = prizes.filter(p => !p.imageUrl);
    
    const updates = await Promise.all(
      prizesWithoutImages.map(async (prize) => {
        const url = await generatePrizeImage(prize.name);
        return { id: prize.id, url };
      })
    );

    setPrizes(prev => prev.map(p => {
      const update = updates.find(u => u.id === p.id);
      return update && update.url ? { ...p, imageUrl: update.url } : p;
    }));

    setIsGenerating(false);
  };

  const participantList = participants.split('\n').filter(n => n.trim());
  const participantCount = participantList.length;

  // Validation Logic
  let canStart = false;
  if (appMode === AppMode.STANDARD) {
    canStart = participantCount > 0 && prizes.length > 0 && participantCount >= prizes.length;
  } else {
    // Gift Exchange: Need at least 2 people to exchange
    canStart = participantCount >= 2;
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 lg:p-8 flex flex-col items-center">
      
      {/* Mode Switcher */}
      <div className="bg-slate-200/50 p-1.5 rounded-2xl flex gap-1 mb-8 shadow-inner">
        <button
          onClick={() => setAppMode(AppMode.STANDARD)}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
            appMode === AppMode.STANDARD 
              ? 'bg-white text-indigo-600 shadow-md' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          🏆 Lucky Draw
        </button>
        <button
          onClick={() => setAppMode(AppMode.GIFT_EXCHANGE)}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
            appMode === AppMode.GIFT_EXCHANGE
              ? 'bg-white text-pink-600 shadow-md' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          🎁 Gift Exchange
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        {/* Participants Column */}
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 flex flex-col h-full min-h-[500px]">
          <div className="mb-4 flex justify-between items-baseline">
            <h2 className="text-2xl font-bold text-slate-800">Participants</h2>
            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              Count: {participantCount}
            </span>
          </div>
          <p className="text-slate-500 text-sm mb-4">Enter names separated by new lines.</p>
          <textarea
            className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-all text-slate-700 leading-relaxed"
            placeholder="Alice&#10;Bob&#10;Charlie..."
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Prizes / Exchange Info Column */}
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 flex flex-col h-full min-h-[500px]">
          
          {appMode === AppMode.STANDARD ? (
            <>
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-slate-800">Prizes</h2>
                <p className="text-slate-500 text-sm mt-1">Add items to the prize pool.</p>
              </div>

              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={newPrizeName}
                  onChange={(e) => setNewPrizeName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPrize()}
                  placeholder="e.g. Brand New Smartphone"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
                <Button onClick={addPrize} disabled={!newPrizeName.trim()}>
                  Add
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-1 custom-scrollbar">
                {prizes.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                    No prizes added yet.
                  </div>
                ) : (
                  prizes.map(prize => (
                    <PrizeItem key={prize.id} prize={prize} onRemove={removePrize} />
                  ))
                )}
              </div>
            </>
          ) : (
            /* GIFT EXCHANGE MODE INFO */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
              <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center text-6xl shadow-inner">
                🎁
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Number Assignment</h2>
                <p className="text-slate-500 max-w-sm mx-auto">
                  We will assign a unique number (1 to {Math.max(participantCount, 2)}) to each participant randomly.
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-3 w-full max-w-xs opacity-50">
                <div className="bg-slate-100 rounded-lg h-12 flex items-center justify-center font-bold text-slate-400">1</div>
                <div className="bg-slate-100 rounded-lg h-12 flex items-center justify-center font-bold text-slate-400">2</div>
                <div className="bg-slate-100 rounded-lg h-12 flex items-center justify-center font-bold text-slate-400">3</div>
                <div className="bg-slate-100 rounded-lg h-12 flex items-center justify-center font-bold text-slate-400">...</div>
                <div className="bg-slate-100 rounded-lg h-12 flex items-center justify-center font-bold text-slate-400">N</div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 mt-auto">
            {appMode === AppMode.STANDARD && (
              <Button 
                variant="secondary" 
                onClick={generateImages} 
                isLoading={isGenerating}
                disabled={prizes.length === 0}
                className="flex-1"
              >
                Auto-Generate Images
              </Button>
            )}
            
            <Button 
              onClick={onStartDraw} 
              disabled={!canStart}
              className={`flex-1 ${appMode === AppMode.GIFT_EXCHANGE ? 'bg-pink-600 hover:bg-pink-700 shadow-pink-200' : ''}`}
            >
              {appMode === AppMode.STANDARD ? 'Start Lucky Draw' : 'Assign Numbers'}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 ml-2">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </Button>
          </div>
          
          {!canStart && (
             <p className="text-xs text-rose-500 mt-2 text-center">
               {appMode === AppMode.STANDARD 
                 ? 'Need more participants than prizes!'
                 : 'Need at least 2 participants for an exchange!'}
             </p>
          )}
        </div>
      </div>
    </div>
  );
};