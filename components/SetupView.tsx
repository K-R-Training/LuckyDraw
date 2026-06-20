
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

const getPlaceholderImage = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const color1 = `hsl(${hue}, 85%, 95%)`;
  const color2 = `hsl(${(hue + 40) % 360}, 85%, 88%)`;
  const icons = ['🎁', '🎀', '🏆', '💎', '👑', '🎉', '🧧', '🧸', '🎮'];
  const icon = icons[Math.abs(hash) % icons.length];
  const decorations = Array.from({ length: 6 }).map((_, i) => {
     const x = (Math.abs(hash * (i + 1)) % 80) + 10;
     const y = (Math.abs(hash * (i + 2)) % 80) + 10;
     const size = (Math.abs(hash * (i + 3)) % 10) + 5;
     const fill = `hsl(${(hue + i * 60) % 360}, 70%, 70%)`;
     return i % 2 === 0 
       ? `<circle cx="${x}%" cy="${y}%" r="${size}" fill="${fill}" opacity="0.3" />`
       : `<rect x="${x}%" y="${y}%" width="${size * 1.5}" height="${size * 1.5}" fill="${fill}" opacity="0.3" transform="rotate(45, ${x}, ${y})" />`;
  }).join('');
  const svg = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="grad_${id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${color1}" /><stop offset="100%" stop-color="${color2}" /></linearGradient></defs><rect width="200" height="200" fill="url(#grad_${id})" />${decorations}<circle cx="100" cy="100" r="60" fill="white" fill-opacity="0.4" /><text x="100" y="115" font-family="sans-serif" font-size="90" text-anchor="middle" dominant-baseline="middle">${icon}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

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
  const [genProgress, setGenProgress] = useState(0);

  const addPrize = () => {
    if (!newPrizeName.trim()) return;
    const id = crypto.randomUUID();
    const newPrize: Prize = {
      id: id,
      name: newPrizeName.trim(),
      imageUrl: getPlaceholderImage(id)
    };
    setPrizes(prev => [...prev, newPrize]);
    setNewPrizeName('');
  };

  const removePrize = (id: string) => {
    setPrizes(prev => prev.filter(p => p.id !== id));
  };

  const generateImages = async () => {
    const prizesToUpdate = prizes.filter(p => 
      !p.imageUrl || 
      p.imageUrl.includes('image/svg+xml')
    );
    if (prizesToUpdate.length === 0) return;

    setIsGenerating(true);
    setGenProgress(0);
    
    // 改為循序生成，避免同時過多請求
    for (let i = 0; i < prizesToUpdate.length; i++) {
      const prize = prizesToUpdate[i];
      const url = await generatePrizeImage(prize.name);
      if (url) {
        setPrizes(prev => prev.map(p => p.id === prize.id ? { ...p, imageUrl: url } : p));
      }
      setGenProgress(Math.round(((i + 1) / prizesToUpdate.length) * 100));
    }

    setIsGenerating(false);
    setGenProgress(0);
  };

  const participantList = participants.split('\n').filter(n => n.trim());
  const canStart = appMode === AppMode.STANDARD 
    ? participantList.length > 0 && prizes.length > 0 && participantList.length >= prizes.length
    : participantList.length >= 2 && participantList.length <= 58;

  const placeholderCount = prizes.filter(p => !p.imageUrl || p.imageUrl.includes('image/svg+xml')).length;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 lg:p-8 flex flex-col items-center">
      <div className="bg-slate-200/50 p-1.5 rounded-2xl flex gap-1 mb-8 shadow-inner">
        <button onClick={() => setAppMode(AppMode.STANDARD)} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${appMode === AppMode.STANDARD ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>🏆 幸運抽獎</button>
        <button onClick={() => setAppMode(AppMode.GIFT_EXCHANGE)} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${appMode === AppMode.GIFT_EXCHANGE ? 'bg-white text-pink-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>🎁 交換禮物</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 flex flex-col h-full min-h-[500px]">
          <div className="mb-4 flex justify-between items-baseline">
            <h2 className="text-2xl font-bold text-slate-800">參與者名單</h2>
            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">人數: {participantList.length}</span>
          </div>
          <textarea className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-700" placeholder="小明&#10;小華..." value={participants} onChange={(e) => setParticipants(e.target.value)} spellCheck={false} />
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 flex flex-col h-full min-h-[500px]">
          {appMode === AppMode.STANDARD ? (
            <>
              <div className="mb-4"><h2 className="text-2xl font-bold text-slate-800">獎品清單</h2></div>
              <div className="flex gap-2 mb-6">
                <input type="text" value={newPrizeName} onChange={(e) => setNewPrizeName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPrize()} placeholder="例如：iPhone 15" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none" />
                <Button onClick={addPrize} disabled={!newPrizeName.trim()}>加入</Button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-1 custom-scrollbar">
                {prizes.length === 0 ? <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-2xl">尚未加入獎品。</div> : prizes.map(prize => <PrizeItem key={prize.id} prize={prize} onRemove={removePrize} />)}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
              <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center text-6xl shadow-inner animate-pulse">🎁</div>
              <h2 className="text-2xl font-bold text-slate-800">禮物號碼自動分配</h2>
              <div className="bg-slate-50 rounded-2xl p-4 border text-left text-sm text-slate-600">有效容量：58 人 (排除 16, 22, 23, 42, 62)</div>
            </div>
          )}

          <div className="space-y-3 pt-4 border-t mt-auto">
            {isGenerating && (
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${genProgress}%` }}></div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              {appMode === AppMode.STANDARD && (
                <Button variant="secondary" onClick={generateImages} isLoading={isGenerating} disabled={prizes.length === 0 || placeholderCount === 0} className="flex-1">
                  {isGenerating ? `生成中 ${genProgress}%` : placeholderCount > 0 ? `生成 ${placeholderCount} 張 AI 圖片` : '圖片已完成'}
                </Button>
              )}
              <Button onClick={onStartDraw} disabled={!canStart} className={`flex-1 ${appMode === AppMode.GIFT_EXCHANGE ? 'bg-pink-600 hover:bg-pink-700 shadow-pink-200' : ''}`}>
                {appMode === AppMode.STANDARD ? '開始抽獎' : '隨機分配編號'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
