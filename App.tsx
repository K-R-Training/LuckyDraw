import React, { useState } from 'react';
import { SetupView } from './components/SetupView';
import { DrawingView } from './components/DrawingView';
import { ResultsView } from './components/ResultsView';
import { DashboardView } from './components/DashboardView';
import { Prize, AppState, AppMode } from './types';

export default function App() {
  const [view, setView] = useState<AppState>(AppState.DASHBOARD);
  const [appMode, setAppMode] = useState<AppMode>(AppMode.STANDARD);
  
  const [participants, setParticipants] = useState<string>('');
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [winners, setWinners] = useState<Prize[]>([]);

  // Used for Gift Exchange to hold the temporary number prizes
  const [activeSessionPrizes, setActiveSessionPrizes] = useState<Prize[]>([]);

  const handleSelectTool = (toolName: string) => {
    if (toolName === 'LUCKY_DRAW') {
      setView(AppState.SETUP);
    } else if (toolName === 'STUDY_PLAN') {
      setView(AppState.STUDY_PLAN);
    }
  };

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

  const handleGoHome = () => {
    setView(AppState.DASHBOARD);
  };

  const getSubTitle = () => {
    if (view === AppState.DASHBOARD) return null;
    if (view === AppState.STUDY_PLAN) return '智慧考前複習計畫';
    return '幸運抽獎';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleGoHome}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold bg-slate-800 shadow-md`}>
              KR
            </div>
            <h1 className="text-xl font-bold text-slate-800">
              K-R-Trainning
              {view !== AppState.DASHBOARD && (
                 <span className="font-normal text-slate-400 ml-2 text-base">
                    / {getSubTitle()}
                 </span>
              )}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             {view !== AppState.DASHBOARD && (
                <button 
                  onClick={handleGoHome}
                  className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                  Home
                </button>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {view === AppState.DASHBOARD && (
          <DashboardView onSelectTool={handleSelectTool} />
        )}

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

        {view === AppState.STUDY_PLAN && (
          <div className="flex-1 w-full bg-white relative animate-[fadeIn_0.5s_ease-out]">
            <iframe 
              src="https://study-plan-9vz7.vercel.app/" 
              className="w-full h-full border-none"
              title="智慧考前複習計畫"
              allow="clipboard-write"
            />
            <div className="absolute top-2 right-4 flex items-center gap-2 pointer-events-none">
              <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">EMBEDDED VIEW</span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      {view !== AppState.STUDY_PLAN && (
        <footer className="py-6 text-center text-slate-400 text-sm">
          <p>K-R-Trainning Tools &copy; {new Date().getFullYear()} | Powered by Google Gemini AI</p>
        </footer>
      )}
    </div>
  );
}