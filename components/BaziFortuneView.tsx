
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from './Button';
import { calculateBaziFortune, getDetailedCategoryAnalysis, getSpecialInquiryAnalysis, generateEmailSummary } from '../services/geminiService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const ELEMENT_COLORS: Record<string, { bg: string, text: string, border: string, accent: string }> = {
  '木': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', accent: 'bg-emerald-600' },
  '火': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', accent: 'bg-rose-600' },
  '土': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', accent: 'bg-amber-700' },
  '金': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', accent: 'bg-slate-500' },
  '水': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', accent: 'bg-blue-600' },
};

const CATEGORY_ICONS: Record<string, { icon: string, color: string, bg: string }> = {
  '財富': { icon: '💰', color: 'text-amber-600', bg: 'bg-amber-50' },
  '事業': { icon: '💼', color: 'text-blue-600', bg: 'bg-blue-50' },
  '愛情': { icon: '❤️', color: 'text-rose-600', bg: 'bg-rose-50' },
  '家庭': { icon: '🏠', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  '健康': { icon: '🍀', color: 'text-teal-600', bg: 'bg-teal-50' },
};

const HOUR_MAP: Record<string, string> = {
  '子時': '子時 (23:00-01:00)',
  '丑時': '丑時 (01:00-03:00)',
  '寅時': '寅時 (03:00-05:00)',
  '卯時': '卯時 (05:00-07:00)',
  '辰時': '辰時 (07:00-09:00)',
  '巳時': '巳時 (09:00-11:00)',
  '午時': '午時 (11:00-13:00)',
  '未時': '未時 (13:00-15:00)',
  '申時': '申時 (16:00-17:00)',
  '酉時': '酉時 (17:00-19:00)',
  '戌時': '戌時 (19:00-21:00)',
  '亥時': '亥時 (21:00-23:00)',
};

const VB_WIDTH = 1000;
const VB_HEIGHT = 560; 
const CHART_PAD_X = 80;
const CHART_PAD_Y_TOP = 10; 
const CHART_PAD_Y_BOTTOM = 220; 
const CHART_INNER_W = VB_WIDTH - (CHART_PAD_X * 2);
const CHART_INNER_H = VB_HEIGHT - CHART_PAD_Y_TOP - CHART_PAD_Y_BOTTOM;

export const BaziFortuneView: React.FC = () => {
  const [formData, setFormData] = useState({
    birthDate: '1975-01-01',
    birthTime: '子時',
    gender: 'male',
    customQuestion: ''
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [specialAnalysis, setSpecialAnalysis] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const [isDeepDiving, setIsDeepDiving] = useState(false);
  const [deepDiveContent, setDeepDiveContent] = useState<string | null>(null);
  const [activeDeepDive, setActiveDeepDive] = useState<{cat: string, year: string} | null>(null);
  const [allDeepDives, setAllDeepDives] = useState<Record<string, string>>({});
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const fullReportRef = useRef<HTMLDivElement>(null);

  const loadingMessages = ["正在對齊干支...", "分析五行強弱...", "推算流年吉凶...", "生成大師報告...", "準備最後結果..."];

  const todayStr = useMemo(() => new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }), []);

  useEffect(() => {
    let interval: any;
    if (isCalculating) {
      interval = setInterval(() => setLoadingStep(prev => (prev + 1) % loadingMessages.length), 1000);
    }
    return () => clearInterval(interval);
  }, [isCalculating]);

  const handleCalculate = async () => {
    if (isCalculating) return;
    setIsCalculating(true);
    setResult(null);
    setSpecialAnalysis(null);
    setAllDeepDives({});
    try {
      const data = await calculateBaziFortune({
        ...formData,
        birthTime: HOUR_MAP[formData.birthTime] || formData.birthTime
      });
      
      if (data && data.shortFortune) {
        setResult(data);
        const currentYear = new Date().getFullYear();
        
        const isNextYearQuery = formData.customQuestion.includes('明年');
        const targetYear = isNextYearQuery ? currentYear + 1 : currentYear;
        
        const targetYearIdx = data.shortFortune.findIndex((f: any) => f.year === targetYear);
        setSelectedIdx(targetYearIdx !== -1 ? targetYearIdx : 0);

        if (formData.customQuestion.trim()) {
          const baziContext = data.bazi.pillars.map((p: any) => `${p.label}:${p.stem}${p.branch}`).join(', ') + `，當前大運：${data.bazi.currentDaYun}`;
          const specialData = await getSpecialInquiryAnalysis({
            birthData: formData,
            question: formData.customQuestion,
            baziContext
          });
          setSpecialAnalysis(specialData);
        }
      } else {
        throw new Error("數據解析異常");
      }
    } catch (e: any) {
      console.error(e);
      alert(`計算失敗：${e.message || '請確認 API Key 後重試'}`);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleDownloadFullPDF = async () => {
    if (!fullReportRef.current) return;
    setIsExporting(true);
    
    const originalStyle = fullReportRef.current.style.display;
    fullReportRef.current.style.display = 'block';
    
    try {
      const canvas = await html2canvas(fullReportRef.current, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.75);
      const pdf = new jsPDF('p', 'mm', 'a4', true);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }
      
      pdf.save(`八字完整流年報告_${formData.birthDate}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("PDF 生成失敗，請再試一次。");
    } finally {
      fullReportRef.current.style.display = originalStyle;
      setIsExporting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!userEmail || !userEmail.includes('@')) {
      alert('請輸入正確的電子信箱');
      return;
    }
    setIsSendingEmail(true);
    try {
      const summary = result?.shortFortune?.[selectedIdx || 0]?.logic || "";
      const emailBody = await generateEmailSummary({
        question: formData.customQuestion,
        summary: summary
      });
      
      const subject = encodeURIComponent(`【命理報告】${formData.birthDate} 流年精選摘要`);
      const body = encodeURIComponent(emailBody + "\n\n---\n本報告由 K-R-Trainning AI 命理系統生成");
      
      window.location.href = `mailto:${userEmail}?subject=${subject}&body=${body}`;
      setIsEmailModalOpen(false);
    } catch (e) {
      console.error(e);
      alert('郵件生成失敗');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDeepDive = async (category: string, year: string, logic: string) => {
    if (!result) return;
    const key = `${year}-${category}`;
    if (allDeepDives[key]) {
      setActiveDeepDive({ cat: category, year });
      setDeepDiveContent(allDeepDives[key]);
      setIsDeepDiving(true);
      return;
    }
    setActiveDeepDive({ cat: category, year });
    setIsDeepDiving(true);
    setDeepDiveContent(null);
    try {
      // 構建完整的八字背景字串
      const baziContext = result.bazi.pillars.map((p: any) => `${p.label}:${p.stem}${p.branch}`).join(', ') + 
                          `，當前大運：${result.bazi.currentDaYun}`;
      
      const content = await getDetailedCategoryAnalysis({ 
        baziContext, 
        year, 
        category, 
        logic 
      });
      if (content) {
        setAllDeepDives(prev => ({ ...prev, [key]: content }));
        setDeepDiveContent(content);
      }
    } catch (e) {
      alert('大師推演失敗，請稍後重試。');
      setIsDeepDiving(false);
    }
  };

  const chartPoints = useMemo(() => {
    if (!result?.shortFortune) return [];
    return result.shortFortune.map((item: any, idx: number) => ({
      year: item.year,
      score: item.score || 50,
      lunar: item.lunar || '',
      zodiac: item.zodiac || '',
      element: item.element || '土',
      highlights: (item.highlights || []).slice(0, 5),
      idx
    }));
  }, [result]);

  const activeData = selectedIdx !== null ? result?.shortFortune[selectedIdx] : null;

  const getX = (i: number, total: number) => {
    if (total <= 1) return CHART_PAD_X;
    return CHART_PAD_X + i * (CHART_INNER_W / (total - 1));
  };
  
  const getY = (score: number) => {
    const s = Math.min(Math.max(score, 0), 100);
    return (VB_HEIGHT - CHART_PAD_Y_BOTTOM) - (s / 100) * CHART_INNER_H;
  };

  const generateSmoothPath = (points: any[]) => {
    if (points.length < 2) return "";
    const total = points.length;
    let d = `M ${getX(0, total)} ${getY(points[0].score)}`;

    for (let i = 0; i < total - 1; i++) {
      const x1 = getX(i, total);
      const y1 = getY(points[i].score);
      const x2 = getX(i + 1, total);
      const y2 = getY(points[i + 1].score);
      const cp1x = x1 + (x2 - x1) * 0.4;
      const cp2x = x1 + (x2 - x1) * 0.6;
      d += ` C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;
    }
    return d;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!chartContainerRef.current || chartPoints.length === 0) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
    
    const normalizedX = (x / rect.width) * VB_WIDTH;
    const relativeX = normalizedX - CHART_PAD_X;
    const step = CHART_INNER_W / (chartPoints.length - 1);
    const closestIdx = Math.round(relativeX / step);
    
    if (closestIdx >= 0 && closestIdx < chartPoints.length) {
      if (closestIdx !== hoveredIdx) setHoveredIdx(closestIdx);
    } else {
      setHoveredIdx(null);
    }
  };

  const getParsedDaYun = (raw: string) => {
    if (!raw) return { title: '當前大運', reason: '' };
    const parts = raw.includes('：') ? raw.split('：') : raw.includes(':') ? raw.split(':') : [null, raw];
    return {
      title: (parts[0] || '當前大運').trim(),
      reason: (parts[1] || (parts[0] ? '' : raw)).trim()
    };
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#fdfaf7] p-4 lg:p-8 relative">
      <div className="max-w-4xl mx-auto space-y-12 pb-32">
        
        {/* Input Panel */}
        <div className="bg-white rounded-[3rem] shadow-2xl border border-amber-100/50 overflow-hidden no-print">
          <div className="bg-[#8b0000] p-8 text-white flex justify-between items-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
             <div className="flex items-center gap-4 relative z-10">
               <div className="w-14 h-14 bg-amber-400/20 rounded-2xl flex items-center justify-center text-3xl border border-white/10 shadow-inner">🔮</div>
               <div>
                 <h2 className="text-2xl font-black tracking-tight">八字流年精算</h2>
                 <p className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase mt-0.5">Professional Bazi Logic v14.0 Core-Analysis</p>
               </div>
             </div>
          </div>

          <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <label className="block">
                <span className="text-[10px] font-black text-amber-800/60 mb-2.5 block uppercase tracking-[0.2em]">出生日期 Birth Date</span>
                <input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="w-full border-2 border-amber-100/50 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 bg-white font-bold" />
              </label>
              <label className="block">
                <span className="text-[10px] font-black text-amber-800/60 mb-2.5 block uppercase tracking-[0.2em]">出生時辰 Hour</span>
                <select value={formData.birthTime} onChange={e => setFormData({...formData, birthTime: e.target.value})} className="w-full border-2 border-amber-100/50 p-4 rounded-2xl outline-none bg-white font-bold appearance-none">
                  {Object.keys(HOUR_MAP).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>
            <div className="space-y-6">
              <label className="block">
                <span className="text-[10px] font-black text-amber-800/60 mb-2.5 block uppercase tracking-[0.2em]">性別 Gender</span>
                <div className="flex gap-3">
                  <button onClick={() => setFormData({...formData, gender: 'male'})} className={`flex-1 p-4 rounded-2xl border-2 font-black transition-all ${formData.gender === 'male' ? 'bg-[#8b0000] text-white border-[#8b0000] shadow-lg' : 'bg-white border-amber-100/50 text-slate-400'}`}>乾造 (男)</button>
                  <button onClick={() => setFormData({...formData, gender: 'female'})} className={`flex-1 p-4 rounded-2xl border-2 font-black transition-all ${formData.gender === 'female' ? 'bg-[#8b0000] text-white border-[#8b0000] shadow-lg' : 'bg-white border-amber-100/50 text-slate-400'}`}>坤造 (女)</button>
                </div>
              </label>
              <label className="block">
                <span className="text-[10px] font-black text-amber-800/60 mb-2.5 block uppercase tracking-[0.2em]">心中所問 Inquiry</span>
                <input value={formData.customQuestion} onChange={e => setFormData({...formData, customQuestion: e.target.value})} className="w-full border-2 border-amber-100/50 p-4 rounded-2xl outline-none bg-white font-bold" placeholder="例如：明年能否轉職？" />
              </label>
            </div>
            <div className="md:col-span-2 pt-4">
              <Button onClick={handleCalculate} isLoading={isCalculating} className="w-full bg-[#8b0000] hover:bg-[#700000] py-5 rounded-[2rem] font-black text-xl shadow-2xl transition-all">
                {isCalculating ? loadingMessages[loadingStep] : "執行深度流年邏輯演算"}
              </Button>
            </div>
          </div>
        </div>

        {result && (
          <div className="animate-[fadeIn_0.6s_ease-out] space-y-20 p-2">
            {/* Toolbar for Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end border-b border-amber-200 pb-4 no-print gap-4">
               <div className="text-center sm:text-left">
                 <h3 className="text-xl font-black text-amber-900">大師鑑定結果報告</h3>
                 <p className="text-xs text-amber-800/40 font-bold uppercase tracking-widest">Calculated Analysis Report</p>
               </div>
               <div className="flex gap-2 w-full sm:w-auto">
                 <Button variant="secondary" onClick={() => setIsEmailModalOpen(true)} className="flex-1 sm:flex-none rounded-2xl border-amber-200 text-amber-900 hover:bg-amber-50">
                    ✉️ 寄送電子郵件
                 </Button>
                 <Button variant="secondary" onClick={handleDownloadFullPDF} isLoading={isExporting} className="flex-1 sm:flex-none rounded-2xl border-amber-200 text-amber-900 hover:bg-amber-50">
                   {isExporting ? '編撰卷軸中...' : '匯出完整 PDF 報告'}
                 </Button>
               </div>
            </div>

            {/* 四柱排盤 */}
            <div className="space-y-8">
              {result.bazi?.currentDaYun && (() => {
                const { title, reason } = getParsedDaYun(result.bazi.currentDaYun);
                return (
                  <div className="bg-amber-900 text-white p-8 rounded-[2.5rem] shadow-xl">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="text-center md:text-left min-w-[120px]">
                         <span className="text-[10px] font-black uppercase tracking-widest opacity-60">當前大運 Luck Cycle</span>
                         <p className="text-3xl font-black mt-1">{title}</p>
                      </div>
                      <div className="h-12 w-[1px] bg-white/20 hidden md:block"></div>
                      <p className="flex-1 text-amber-50/80 font-medium text-sm leading-relaxed">{reason}</p>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {result.bazi?.pillars?.map((p: any, idx: number) => {
                  const colors = ELEMENT_COLORS[p.element] || ELEMENT_COLORS['土'];
                  const isDayColumn = p.label === '日柱';
                  return (
                    <div key={idx} className="relative group">
                      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 ${isDayColumn ? 'bg-amber-900' : colors.accent} text-white text-[9px] font-black rounded-full shadow-lg z-20`}>
                        {p.label}
                      </div>
                      <div className={`bg-white border-2 ${isDayColumn ? 'border-amber-900 ring-4 ring-amber-50' : colors.border} rounded-[2.5rem] p-7 shadow-xl overflow-hidden`}>
                        <div className="flex flex-col items-center gap-3 relative z-10">
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black text-slate-300 mb-2 uppercase">天干</span>
                            <div className={`text-6xl font-black ${colors.text} leading-none`}>{p.stem}</div>
                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg ${isDayColumn ? 'bg-amber-900 text-white' : 'bg-slate-50 text-slate-400'}`}>
                              {isDayColumn ? `命主` : (p.stemGod)}
                            </span>
                          </div>
                          <div className={`w-12 h-[1px] ${colors.accent} opacity-20 my-2`}></div>
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black text-slate-300 mb-2 uppercase">地支</span>
                            <div className={`text-6xl font-black ${colors.text} leading-none`}>{p.branch}</div>
                            <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">{p.branchGod}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 本命格綜合分析 */}
            {result.bazi && (
              <div className="bg-white rounded-[3.5rem] p-10 shadow-xl border border-amber-100 space-y-10 animate-[fadeIn_0.5s_ease-out]">
                <div className="flex items-center gap-4 border-b border-amber-50 pb-6">
                  <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg">☯️</div>
                  <div>
                    <h3 className="text-2xl font-black text-amber-950">本命格綜合分析</h3>
                    <p className="text-xs text-amber-800/40 font-bold uppercase tracking-widest">Core Destiny Analysis</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {/* 五行能量分佈 */}
                  <div className="lg:col-span-1 space-y-6">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       五行能量 Energy Focus
                    </h4>
                    <div className="space-y-4 bg-slate-50 p-6 rounded-3xl">
                      {Object.entries(result.bazi.energyScores || {}).map(([key, score]: [string, any]) => {
                        const labels: any = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
                        const colors = ELEMENT_COLORS[labels[key]] || ELEMENT_COLORS['土'];
                        return (
                          <div key={key} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-black px-1">
                              <span className={colors.text}>{labels[key]}</span>
                              <span className="text-slate-400">{score}%</span>
                            </div>
                            <div className="h-3 bg-white rounded-full overflow-hidden border border-slate-100 shadow-inner">
                              <div className={`h-full ${colors.accent} transition-all duration-1000`} style={{ width: `${score}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 文字分析區塊 */}
                  <div className="lg:col-span-2 space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">性格特質 Personality</span>
                           <p className="text-sm text-slate-700 leading-relaxed font-bold">{result.bazi.personality}</p>
                        </div>
                        <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                           <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-2">喜用建議 Favorable Elements</span>
                           <p className="text-sm text-slate-700 leading-relaxed font-bold">{result.bazi.favorableElements}</p>
                        </div>
                     </div>
                     <div className="bg-amber-50/50 p-8 rounded-3xl border border-amber-100">
                        <span className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest block mb-2">總體運勢趨勢 Life Trend</span>
                        <p className="text-base text-amber-900 leading-loose font-medium">{result.bazi.generalFortune}</p>
                     </div>
                     <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100">
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-2">應注意事項 Warnings</span>
                        <p className="text-sm text-rose-800 leading-relaxed font-bold italic">● {result.bazi.warnings}</p>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* 互動趨勢圖 */}
            <div className="space-y-8 no-print">
              <div 
                ref={chartContainerRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => hoveredIdx !== null && setSelectedIdx(hoveredIdx)}
                className="bg-white rounded-[4rem] p-6 border border-amber-100 shadow-2xl h-[560px] relative overflow-hidden cursor-crosshair"
              >
                <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`} preserveAspectRatio="xMidYMid meet">
                  <g className="chart-regions">
                    <rect x={CHART_PAD_X} y={getY(100)} width={CHART_INNER_W} height={getY(80) - getY(100)} fill="#fef3c7" fillOpacity="0.45" />
                    <text x={VB_WIDTH - CHART_PAD_X + 10} y={getY(90)} className="text-[14px] font-black fill-amber-700 uppercase" dominantBaseline="middle">大吉 巔峰</text>
                    
                    <rect x={CHART_PAD_X} y={getY(80)} width={CHART_INNER_W} height={getY(40) - getY(80)} fill="#f0fdf4" fillOpacity="0.45" />
                    <text x={VB_WIDTH - CHART_PAD_X + 10} y={getY(60)} className="text-[14px] font-black fill-emerald-700 uppercase" dominantBaseline="middle">平穩 順遂</text>
                    
                    <rect x={CHART_PAD_X} y={getY(40)} width={CHART_INNER_W} height={getY(0) - getY(40)} fill="#fff1f2" fillOpacity="0.45" />
                    <text x={VB_WIDTH - CHART_PAD_X + 10} y={getY(20)} className="text-[14px] font-black fill-rose-700 uppercase" dominantBaseline="middle">低迷 謹慎</text>
                  </g>

                  <line x1={CHART_PAD_X} y1={getY(50)} x2={CHART_PAD_X + CHART_INNER_W} y2={getY(50)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />

                  {hoveredIdx !== null && (
                    <line 
                      x1={getX(hoveredIdx, chartPoints.length)} 
                      y1={CHART_PAD_Y_TOP} 
                      x2={getX(hoveredIdx, chartPoints.length)} 
                      y2={VB_HEIGHT - 60} 
                      stroke="#8b0000" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.3"
                    />
                  )}

                  <path d={generateSmoothPath(chartPoints)} fill="none" stroke="#8b0000" strokeWidth="12" strokeLinecap="round" className="drop-shadow-lg" />

                  {chartPoints.map((p, i) => {
                    const cx = getX(i, chartPoints.length);
                    const cy = getY(p.score);
                    const isHovered = hoveredIdx === i;
                    const axisBaseY = VB_HEIGHT - 90; 
                    const tagGap = 26;
                    
                    return (
                      <g key={i}>
                        <line x1={cx} y1={cy + 14} x2={cx} y2={axisBaseY - 60} stroke={isHovered ? "#8b0000" : "#cbd5e1"} strokeWidth="2" strokeDasharray="4 2" />
                        <circle cx={cx} cy={cy} r={selectedIdx === i || isHovered ? "14" : "7"} fill={selectedIdx === i || isHovered ? "#8b0000" : "white"} stroke="#8b0000" strokeWidth="4" className="transition-all duration-300" />

                        <g transform={`translate(${cx}, ${axisBaseY})`}>
                          <g 
                            style={{ 
                              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                              transformOrigin: '0px 0px', 
                              transition: 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}
                          >
                            <text y="35" textAnchor="middle" className={`text-base font-black transition-colors duration-300 ${selectedIdx === i || isHovered ? 'fill-[#8b0000]' : 'fill-slate-400'}`}>
                              {p.year}
                            </text>
                            <g transform="translate(0, 5)">
                              <rect x="-20" y="-10" width="40" height="20" rx="6" fill={isHovered ? "#8b0000" : "#f1f5f9"} />
                              <text textAnchor="middle" dominantBaseline="middle" className={`text-[11px] font-black ${isHovered ? 'fill-white' : 'fill-slate-500'}`}>{p.zodiac}</text>
                            </g>
                            <g transform={`translate(0, -32)`}>
                              {(p.highlights || []).map((tag, tidx) => {
                                const isNegative = ["血光", "災難", "破財", "刑剋", "口舌", "官非"].includes(tag);
                                const color = isHovered ? (isNegative ? "#f43f5e" : "#ea580c") : (isNegative ? "#be123c" : "#8b0000");
                                return (
                                  <g key={tag} transform={`translate(0, ${-tidx * tagGap})`}>
                                    <rect x="-42" y="-11" width="84" height="22" rx="11" fill={color} className="transition-colors duration-300 shadow-sm" />
                                    <text textAnchor="middle" dominantBaseline="middle" className="text-[12px] font-black fill-white pointer-events-none">{tag}</text>
                                  </g>
                                );
                              })}
                            </g>
                          </g>
                        </g>
                      </g>
                    );
                  })}
                </svg>
                
                {hoveredIdx !== null && chartPoints[hoveredIdx] && (
                  <div 
                    className="absolute z-[999] pointer-events-none bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-white/10 min-w-[140px] no-print"
                    style={{ 
                      left: `${mousePos.x + (mousePos.x > (chartContainerRef.current?.clientWidth || 0) - 160 ? -160 : 20)}px`, 
                      top: `${mousePos.y + 10}px`
                    }}
                  >
                    <div className="flex justify-between items-center gap-2 mb-1.5 border-b border-white/10 pb-1.5">
                      <span className="text-sm font-black">{chartPoints[hoveredIdx].year} {chartPoints[hoveredIdx].lunar}</span>
                      <span className="bg-[#8b0000] px-2 py-0.5 rounded text-[11px] font-black">{chartPoints[hoveredIdx].score}分</span>
                    </div>
                    <p className="text-[10px] font-bold text-amber-400">點擊查看此年五大領域分析</p>
                  </div>
                )}
              </div>
            </div>

            {/* 年度詳解 */}
            {activeData && (
              <div className="bg-white p-12 rounded-[3.5rem] border-2 border-amber-100 shadow-xl space-y-12 animate-[fadeIn_0.5s_ease-out] no-print">
                <div className="flex flex-col md:flex-row justify-between items-center gap-10 border-b border-amber-50 pb-12">
                  <div className="text-center md:text-left flex-1">
                    <h4 className="text-5xl font-black text-amber-950">{activeData.year} 年 <span className="text-[#8b0000]">{activeData.lunar}</span></h4>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {activeData.highlights?.map((h: string) => (
                        <span key={h} className="text-xs font-black bg-indigo-500 text-white px-5 py-2 rounded-full uppercase shadow-md">{h}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-amber-50 px-12 py-6 rounded-[2.5rem] text-center min-w-[160px]">
                    <div className="text-6xl font-black text-[#8b0000]">{activeData.score}</div>
                    <div className="text-[10px] font-black text-amber-800/40 tracking-[0.4em] mt-1">FORTUNE INDEX</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-slate-50 to-white p-10 rounded-[2.5rem] border border-slate-100">
                  <h5 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-6 bg-[#8b0000] rounded-full"></div>
                    本年運勢邏輯詳解
                  </h5>
                  <p className="text-slate-700 text-xl leading-[2.2] font-medium whitespace-pre-wrap">{activeData.logic}</p>
                </div>

                <div className="space-y-6">
                  <h5 className="text-xl font-black text-slate-800 flex items-center gap-3">
                    <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                    五大核心領域預測 (可點擊深度解讀)
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeData.cats?.map((c: any) => {
                      const cfg = CATEGORY_ICONS[c.n] || { icon: '✨', color: 'text-slate-600', bg: 'bg-slate-50' };
                      const hasAnalyzed = !!allDeepDives[`${activeData.year}-${c.n}`];
                      return (
                        <div 
                          key={c.n} 
                          onClick={() => handleDeepDive(c.n, activeData.year.toString(), activeData.logic)} 
                          className={`group relative bg-white p-6 rounded-[2.5rem] border ${hasAnalyzed ? 'border-indigo-200 ring-2 ring-indigo-50' : 'border-slate-100'} shadow-sm hover:shadow-2xl hover:-translate-y-1 cursor-pointer transition-all overflow-hidden`}
                        >
                          <div className={`absolute top-0 right-0 p-4 text-4xl opacity-10 group-hover:opacity-20 transition-opacity`}>{cfg.icon}</div>
                          {hasAnalyzed && (
                            <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm z-20 flex items-center gap-1">
                              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                              已解讀
                            </div>
                          )}
                          <div className="flex justify-between items-center mb-3 relative z-10">
                            <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center text-xl shadow-inner`}>{cfg.icon}</div>
                               <span className={`${cfg.color} font-black text-lg tracking-tight`}>{c.n}</span>
                            </div>
                            <div className={`px-3 py-1 rounded-xl ${cfg.bg} ${cfg.color} font-black text-xs border border-current/10 shadow-sm`}>
                              指數: {c.s}
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 font-bold leading-relaxed mb-4 line-clamp-3 relative z-10">
                            {c.d}
                          </p>
                          <div className={`flex items-center text-[9px] font-black ${hasAnalyzed ? 'text-indigo-600' : 'text-slate-400'} gap-2 group-hover:text-indigo-600 transition-colors uppercase tracking-[0.2em] no-print`}>
                            {hasAnalyzed ? '點擊重新查閱錦囊' : '點擊啟動 AI 深度指引'} <svg className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 心中所問 - 深度專項報告 */}
            {specialAnalysis && (
              <div className="bg-[#2d2d2d] text-white p-12 rounded-[4rem] shadow-2xl border-t-8 border-amber-600 space-y-8 animate-[fadeIn_0.7s_ease-out]">
                <div className="flex items-center gap-6 border-b border-white/10 pb-8">
                  <div className="w-20 h-20 bg-amber-600 rounded-3xl flex items-center justify-center text-4xl shadow-lg animate-pulse">📜</div>
                  <div>
                    <h3 className="text-3xl font-black tracking-tight">心中所問：深度專項分析</h3>
                    <p className="text-amber-500 font-bold text-xs uppercase tracking-widest mt-1">Master's Specialized Inquiry Diagnosis</p>
                  </div>
                </div>
                <div className="bg-black/20 p-8 rounded-3xl border border-white/5">
                  <p className="text-amber-100 font-bold mb-2 text-sm uppercase opacity-60">您的問題 Your Inquiry</p>
                  <p className="text-2xl font-black italic">「{formData.customQuestion}」</p>
                </div>
                <div className="text-slate-200 leading-[2.6] text-xl font-medium whitespace-pre-wrap prose prose-invert prose-amber max-w-none">
                  {specialAnalysis}
                </div>
                <div className="flex justify-center pt-8">
                  <div className="px-8 py-3 bg-amber-600/10 border border-amber-600/30 rounded-full text-amber-500 text-[10px] font-black uppercase tracking-[0.4em]">
                    End of Specialized Diagnosis
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-[scaleIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
             <div className="bg-amber-900 p-8 text-white flex justify-between items-center">
                <h3 className="text-xl font-black">寄送分析摘要</h3>
                <button onClick={() => setIsEmailModalOpen(false)} className="text-white/50 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
             </div>
             <div className="p-10 space-y-6">
                <div>
                   <label className="block text-xs font-black text-amber-800 uppercase tracking-widest mb-3">電子信箱 Email Address</label>
                   <input 
                    type="email" 
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full border-2 border-amber-100 p-4 rounded-2xl outline-none focus:border-amber-600 font-bold text-slate-800"
                   />
                </div>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  點擊確認後，AI 將根據您的分析結果自動生成一封專業的摘要內容，並喚起您的郵件軟體。
                </p>
                <Button 
                  onClick={handleSendEmail} 
                  isLoading={isSendingEmail} 
                  className="w-full bg-amber-600 hover:bg-amber-700 py-4 rounded-2xl font-black"
                >
                  確認並生成郵件內容
                </Button>
             </div>
          </div>
        </div>
      )}

      {/* HIDDEN FULL REPORT FOR PDF EXPORT */}
      <div 
        ref={fullReportRef} 
        style={{ display: 'none', width: '800px', padding: '60px', background: 'white' }} 
        className="font-sans text-slate-800"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-[#8b0000] mb-2">K-R-Trainning 八字流年詳批報告</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Official Destiny Analysis Scroll</p>
          <div className="flex items-center justify-center gap-4 mt-4">
             <div className="h-[1px] bg-slate-200 flex-1"></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">鑑定日期：{todayStr}</p>
             <div className="h-[1px] bg-slate-200 flex-1"></div>
          </div>
        </div>

        {/* Info & Pillars */}
        <div className="mb-12 grid grid-cols-2 gap-8 bg-slate-50 p-8 rounded-3xl">
           <div>
             <h3 className="text-xs font-black text-slate-400 uppercase mb-2">基本資訊 Basic Info</h3>
             <p className="text-lg font-bold">出生日期：{formData.birthDate}</p>
             <p className="text-lg font-bold">出生時辰：{formData.birthTime}</p>
             <p className="text-lg font-bold">性別：{formData.gender === 'male' ? '乾造 (男)' : '坤造 (女)'}</p>
           </div>
           <div>
             <h3 className="text-xs font-black text-slate-400 uppercase mb-2">當前大運 Luck Cycle</h3>
             <p className="text-lg font-bold text-[#8b0000]">{getParsedDaYun(result?.bazi?.currentDaYun).title}</p>
             <p className="text-sm text-slate-600 leading-relaxed">{getParsedDaYun(result?.bazi?.currentDaYun).reason}</p>
           </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-16 border-b pb-12">
          {result?.bazi?.pillars?.map((p: any, idx: number) => (
            <div key={idx} className="bg-white border-2 border-slate-200 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-black text-slate-300 block mb-2">{p.label}</span>
              <div className="text-3xl font-black text-slate-800 leading-none mb-2">{p.stem}</div>
              <div className="text-3xl font-black text-slate-800 leading-none">{p.branch}</div>
            </div>
          ))}
        </div>

        {/* 本命格綜合分析 (PDF VERSION) */}
        {result?.bazi && (
          <div className="mb-16 space-y-8">
            <h2 className="text-2xl font-black text-slate-900 border-b-2 border-slate-100 pb-4">本命格綜合鑑定分析</h2>
            <div className="grid grid-cols-1 gap-6">
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                    <h4 className="text-sm font-black text-slate-400 uppercase mb-4">五行能量 Energy Balance</h4>
                    <div className="grid grid-cols-5 gap-4">
                        {Object.entries(result.bazi.energyScores || {}).map(([key, score]: [string, any]) => {
                            const labels: any = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
                            return (
                                <div key={key} className="text-center">
                                    <div className="text-xs font-bold text-slate-500 mb-1">{labels[key]}</div>
                                    <div className="text-xl font-black text-amber-900">{score}%</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="space-y-6">
                    <div>
                        <span className="text-xs font-black text-indigo-500 uppercase">性格特質</span>
                        <p className="text-slate-700 leading-relaxed font-bold">{result.bazi.personality}</p>
                    </div>
                    <div>
                        <span className="text-xs font-black text-emerald-500 uppercase">喜用建議</span>
                        <p className="text-slate-700 leading-relaxed font-bold">{result.bazi.favorableElements}</p>
                    </div>
                    <div className="bg-amber-50 p-6 rounded-2xl">
                        <span className="text-xs font-black text-amber-600 uppercase">總體運勢趨勢</span>
                        <p className="text-amber-950 font-medium leading-loose">{result.bazi.generalFortune}</p>
                    </div>
                    <div>
                        <span className="text-xs font-black text-rose-500 uppercase">應注意事項</span>
                        <p className="text-rose-900 leading-relaxed font-bold">{result.bazi.warnings}</p>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* 心中所問 - 深度報告 (如果有的話) */}
        {specialAnalysis && (
          <div className="mb-16 bg-[#fafafa] border-l-8 border-amber-600 p-10 rounded-3xl">
            <h2 className="text-2xl font-black text-slate-900 mb-4">心中所問 - 深度專項分析</h2>
            <div className="bg-white p-6 rounded-2xl mb-8 border border-slate-100 italic font-bold text-lg text-slate-600">
              「{formData.customQuestion}」
            </div>
            <div className="text-slate-700 leading-[2] text-base whitespace-pre-wrap">
              {specialAnalysis}
            </div>
          </div>
        )}

        {/* All Years Detailed Logic */}
        <div className="space-y-16">
          <h2 className="text-2xl font-black text-slate-900 border-b-2 border-slate-100 pb-4 mb-8">九年流年邏輯詳批</h2>
          {result?.shortFortune?.map((yearData: any) => (
            <div key={yearData.year} className="page-break-inside-avoid bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-black text-amber-950">
                  {yearData.year} 年 <span className="text-[#8b0000]">{yearData.lunar}</span> ({yearData.zodiac})
                </h3>
                <div className="bg-amber-50 px-6 py-2 rounded-2xl text-xl font-black text-[#8b0000]">
                  吉凶指數: {yearData.score}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {yearData.highlights?.map((h: string) => (
                  <span key={h} className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase">{h}</span>
                ))}
              </div>
              <div className="mb-8">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">大師詳論 Analysis</h4>
                <p className="text-slate-700 leading-loose text-base font-medium whitespace-pre-wrap">{yearData.logic}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {yearData.cats?.map((c: any) => (
                  <div key={c.n} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="font-black text-xs text-slate-400 block mb-1">{c.n} (指數: {c.s})</span>
                    <p className="text-sm text-slate-600 leading-relaxed">{c.d}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-24 text-center text-slate-300 text-[10px] font-bold uppercase tracking-[0.5em]">
          End of Destiny Scroll Analysis
        </div>
      </div>

      {isDeepDiving && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-[scaleIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="p-10 bg-[#8b0000] text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="relative z-10">
                <h3 className="text-3xl font-black">{activeDeepDive?.year} {activeDeepDive?.cat} 深度錦囊</h3>
                <p className="text-xs font-bold opacity-70 mt-1 uppercase tracking-widest">Master Logic Analysis</p>
              </div>
              <button onClick={() => setIsDeepDiving(false)} className="bg-white/10 p-5 rounded-2xl hover:bg-white/20 transition-all active:scale-90 relative z-10">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-12 overflow-y-auto bg-slate-50 flex-1">
              {!deepDiveContent ? (
                <div className="flex flex-col items-center py-20 gap-8">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-[#8b0000] border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">⏳</div>
                  </div>
                  <p className="text-amber-900 font-black text-lg animate-pulse">大師正在運算此年因果關係...</p>
                </div>
              ) : (
                <div className="text-slate-800 leading-[2.6] text-xl font-medium whitespace-pre-wrap prose prose-slate max-w-none">
                   {deepDiveContent}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
