import React from 'react';
import { Button } from './Button';

interface DashboardViewProps {
  onSelectTool: (toolName: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onSelectTool }) => {
  return (
    <div className="w-full max-w-6xl mx-auto p-4 lg:p-12 flex flex-col items-center animate-[fadeIn_0.5s_ease-out]">
      
      {/* Hero Section */}
      <div className="text-center mb-16 space-y-4">
        <div className="inline-block p-4 rounded-3xl bg-indigo-100 text-indigo-600 mb-4 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
          </svg>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
          K-R-Trainning<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">專用小工具</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Welcome to your personal toolkit. Select a tool below to get started.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
        
        {/* Tool 1: Lucky Draw (Active) */}
        <div 
          onClick={() => onSelectTool('LUCKY_DRAW')}
          className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:shadow-indigo-200/50 border border-slate-100 hover:border-indigo-100 transition-all duration-300 cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-32 h-32 text-indigo-600 transform rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
          </div>
          
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform">
              <span className="text-3xl">🎰</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
              幸運抽獎
            </h3>
            <p className="text-slate-500 mb-6 leading-relaxed">
              AI 賦能的幸運輪盤與抽獎工具。自動生成獎品圖片，打造最刺激的活動體驗。
            </p>
            <div className="flex items-center text-indigo-600 font-bold group-hover:translate-x-2 transition-transform">
              進入工具 <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </div>
          </div>
        </div>

        {/* Tool 2: Under Development */}
        <div className="relative bg-slate-50 rounded-3xl p-8 border border-dashed border-slate-300 flex flex-col items-start opacity-75 select-none">
          <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400 mb-6">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-400 mb-2">
            待開發
          </h3>
          <p className="text-slate-400 mb-6">
            更多精彩工具正在開發中，敬請期待...
          </p>
          <div className="px-3 py-1 bg-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-full">
            Coming Soon
          </div>
        </div>

        {/* Tool 3: Under Development */}
         <div className="relative bg-slate-50 rounded-3xl p-8 border border-dashed border-slate-300 flex flex-col items-start opacity-75 select-none">
          <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400 mb-6">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-400 mb-2">
            待開發
          </h3>
          <p className="text-slate-400 mb-6">
             更多精彩工具正在開發中，敬請期待...
          </p>
          <div className="px-3 py-1 bg-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-full">
            Coming Soon
          </div>
        </div>

      </div>
    </div>
  );
};