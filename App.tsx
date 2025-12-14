import React, { useState } from 'react';
import { SetupView } from './components/SetupView';
import { DrawingView } from './components/DrawingView';
import { ResultsView } from './components/ResultsView';
import { Prize, AppState, AppMode } from './types';

export default function App() {
  const [view, setView] = useState<AppState>(AppState.SETUP);
  const [appMode, setAppMode] = useState<AppMode>(AppMode.STANDARD);
  
  const [participants, setParticipants] = useState<string>('');
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [winners, setWinners] = useState<Prize[]>([]);

  // Used for Gift Exchange to hold the temporary number prizes
  const [activeSessionPrizes, setActiveSessionPrizes] = useState<Prize[]>([]);

  const handleStartDraw = () => {
    if (appMode === AppMode.GIFT_EXCHANGE) {
      // Auto-generate numeric prizes
      const names = participants.split('\n').filter(n => n.trim());
      const numberPrizes: Prize[] = names.map((_, i) => ({
        id: `num-${i + 1}`,
        name: `No. ${i + 1}`,
        // No image needed for numbers, or we could add a placeholder if we wanted
      }));
      setActiveSessionPrizes(numberPrizes);
    } else {
      setActiveSessionPrizes(prizes);
    }
    setView(AppState.DRAWING);
  };

  const handleFinishDraw = (results: Prize[]) => {
    setWinners(results);
    setView(AppState.FINISHED);
  };

  const handleReset = () => {
    setWinners([]);
    setView(AppState.SETUP);
    // Note: We don't clear participants or manual prizes here
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold ${appMode === AppMode.GIFT_EXCHANGE ? 'bg-pink-500' : 'bg-indigo-600'}`}>
              L
            </div>
            <h1 className={`text-xl font-bold bg-clip-text text-transparent ${appMode === AppMode.GIFT_EXCHANGE ? 'bg-gradient-to-r from-pink-600 to-rose-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
              LuckyGen
            </h1>
          </div>
          <div className="text-sm font-medium text-slate-500">
             {view === AppState.SETUP && 'Setup'}
             {view === AppState.DRAWING && (appMode === AppMode.GIFT_EXCHANGE ? 'Exchange...' : 'Drawing...')}
             {view === AppState.FINISHED && 'Results'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {view === AppState.SETUP && (
          <SetupView 
            participants={participants}
            setParticipants={setParticipants}
            prizes={prizes}
            setPrizes={setPrizes}
            onStartDraw={handleStartDraw}
            appMode={appMode}
            setAppMode={setAppMode}
          />
        )}

        {view === AppState.DRAWING && (
          <DrawingView 
            participants={participants.split('\n').filter(n => n.trim())}
            prizes={activeSessionPrizes}
            onFinish={handleFinishDraw}
            onBack={() => setView(AppState.SETUP)}
            isBatchMode={appMode === AppMode.GIFT_EXCHANGE}
          />
        )}

        {view === AppState.FINISHED && (
          <ResultsView 
            winners={winners}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-400 text-sm">
        <p>Powered by Google Gemini AI</p>
      </footer>
    </div>
  );
}