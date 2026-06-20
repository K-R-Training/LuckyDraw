import React, { useState } from 'react';
import { Button } from './Button';
import { GoogleGenAI, Type } from "@google/genai";

export const StudyPlanView: React.FC = () => {
  const [subjects, setSubjects] = useState('');
  const [days, setDays] = useState('7');
  const [hoursPerDay, setHoursPerDay] = useState('4');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any[] | null>(null);

  const handleGenerate = async () => {
    if (!subjects.trim()) return alert('請輸入考科清單');
    
    setIsGenerating(true);
    try {
      // Dynamic AI instance creation for API key consistency
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash", // Upgraded to 3.5 Flash for faster and intelligent planning logic
        contents: `I need a study plan for the following subjects: ${subjects}. 
                   I have ${days} days until the exam and can study for ${hoursPerDay} hours per day. 
                   Generate a structured daily plan. Provide specific focus areas and study tips for each day.`,
        config: {
          thinkingConfig: { thinkingBudget: 4000 }, // Enable reasoning for better plans
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.INTEGER },
                subject: { type: Type.STRING },
                focus: { type: Type.STRING, description: "Detailed focus for this day" },
                tips: { type: Type.STRING, description: "Specific study tip or memory technique" }
              },
              required: ["day", "subject", "focus", "tips"]
            }
          }
        }
      });

      const planData = JSON.parse(response.text || '[]');
      setGeneratedPlan(planData);
    } catch (error) {
      console.error("Study plan generation error:", error);
      alert('AI 規劃失敗，請檢查金鑰是否有額度或網路狀態。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPlan = () => {
    if (!generatedPlan) return;
    const text = generatedPlan.map(d => `Day ${d.day} [${d.subject}]: ${d.focus}\n💡 Tip: ${d.tips}`).join('\n\n');
    navigator.clipboard.writeText(text);
    alert('計畫已複製到剪貼簿！');
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 p-4 lg:p-12 animate-[fadeIn_0.5s_ease-out]">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
          
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white">
            <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
              📝 考試複習計畫生成器
            </h2>
            <p className="opacity-80 font-medium tracking-wide">Powered by Gemini 3.5 Flash Reasoning</p>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-slate-700 font-bold mb-2 block">考科清單 (一行一個)</span>
                  <textarea 
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                    placeholder="例如：&#10;國文 (文言文)&#10;數學 (微積分)&#10;英文 (單字)"
                    className="w-full h-40 bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none text-sm"
                  />
                </label>
              </div>

              <div className="space-y-6">
                <label className="block">
                  <span className="text-slate-700 font-bold mb-2 block">倒數天數 (Days)</span>
                  <input 
                    type="number" 
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </label>

                <label className="block">
                  <span className="text-slate-700 font-bold mb-2 block">每日可用時數 (Hours)</span>
                  <input 
                    type="number" 
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </label>

                <Button 
                  onClick={handleGenerate} 
                  isLoading={isGenerating}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 text-lg rounded-2xl"
                >
                  🚀 生成 AI 衝刺計畫 (Pro)
                </Button>
              </div>
            </div>

            {generatedPlan && (
              <div className="mt-12 space-y-6 animate-[scaleIn_0.4s_ease-out]">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <h3 className="text-2xl font-black text-slate-800">您的個人化復習表</h3>
                  <button onClick={handleCopyPlan} className="text-emerald-600 font-bold text-sm hover:underline">
                    📋 複製全文
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {generatedPlan.map((day) => (
                    <div key={day.day} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex gap-6 hover:shadow-md transition-shadow group">
                      <div className="shrink-0 w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center border border-emerald-100 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <span className="text-[10px] font-black uppercase">Day</span>
                        <span className="text-2xl font-black leading-none">{day.day}</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="bg-emerald-100 text-emerald-700 px-3 py-0.5 rounded-full text-xs font-black uppercase">
                            {day.subject}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-800">{day.focus}</h4>
                        <div className="flex items-start gap-2 text-sm text-slate-500 bg-white/50 p-3 rounded-xl border border-dashed border-slate-200">
                          <span className="text-emerald-500">💡</span>
                          <p>{day.tips}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};