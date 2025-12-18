import React, { useState } from 'react';
import { SetupView } from './components/SetupView';
import { DrawingView } from './components/DrawingView';
import { ResultsView } from './components/ResultsView';
import { DashboardView } from './components/DashboardView';
import { NanoPromptsView } from './components/NanoPromptsView';
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
    } else if (toolName === 'NANO_PROMPTS') {
      setView(AppState.NANO_PROMPTS);
    }
  };

  const handleStartDraw = () => {
    if (appMode === AppMode.GIFT_EXCHANGE) {
      const names = participants.split('\n').filter(n => n.trim());
      const numberPrizes: Prize[] = names.map((_, i) => ({
        id: `num-${i + 1}`,
        name: `No. ${i + 1}`,
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
  };

  const handleGoHome = () => {
    setView(AppState.DASHBOARD);
  };

  const getSubTitle = () => {
    if (view === AppState.DASHBOARD) return null;
    if (view === AppState.STUDY_PLAN) return '智慧考前複習計畫';
    if (view === AppState.NANO_PROMPTS) return 'Nano Banana 提示詞';
    return '幸運抽獎';
  };

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col overflow-hidden">
      {/* Header - Fixed Height */}
      <header className="bg-white/80 backdrop-blur-md shrink-0 z-50 border-b border-slate-100 h-16">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleGoHome}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold bg-slate-800 shadow-md`}>
              KR
            </div>
            <h1 className="text-xl font-bold text-slate-800">
              K-R-Trainning
              {view !== AppState.DASHBOARD && (
                 <span className="font-normal text-slate-400 ml-2 text-base hidden sm:inline">
                    / {getSubTitle()}
                 </span>
              )}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             {view !== AppState.DASHBOARD && (
                <button 
                  onClick={handleGoHome}
                  className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                  <span className="hidden xs:inline">首頁</span>
                </button>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 w-full ${(view === AppState.STUDY_PLAN || view === AppState.NANO_PROMPTS) ? 'overflow-hidden' : 'overflow-y-auto'}`}>
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
          <div className="w-full h-full bg-white animate-[fadeIn_0.5s_ease-out]">
            <iframe 
              src="https://study-plan-9vz7.vercel.app/" 
              className="w-full h-full border-none"
              title="智慧考前複習計畫"
              allow="clipboard-write"
            />
          </div>
        )}

        {view === AppState.NANO_PROMPTS && (
          <div className="w-full h-full overflow-y-auto bg-slate-50">
            <NanoPromptsView />
          </div>
        )}

        {/* Inner Footer */}
        {view !== AppState.STUDY_PLAN && view !== AppState.NANO_PROMPTS && (
          <footer className="py-8 text-center text-slate-400 text-sm mt-auto">
            <p>K-R-Trainning Tools &copy; {new Date().getFullYear()} | Powered by Google Gemini AI</p>
          </footer>
        )}
      </main>
    </div>
  );
}