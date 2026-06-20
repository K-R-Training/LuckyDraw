
import { GoogleGenAI, Type } from "@google/genai";
import { Solar } from "lunar-javascript";

const getAiInstance = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please ensure it is configured.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const cleanJsonString = (str: string) => {
  if (!str) return "{}";
  let cleaned = str.replace(/```json/g, "").replace(/```/g, "").trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
};

const getElementFromStem = (stem: string): string => {
  if ('甲乙'.includes(stem)) return '木';
  if ('丙丁'.includes(stem)) return '火';
  if ('戊己'.includes(stem)) return '土';
  if ('庚辛'.includes(stem)) return '金';
  if ('壬癸'.includes(stem)) return '水';
  return '土';
};

const getExactPillars = (dateStr: string, timeStr: string) => {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const hourMap: Record<string, number> = {
      '子時': 0, '丑時': 2, '寅時': 4, '卯時': 6, '辰時': 8, '巳時': 10,
      '午時': 12, '未時': 14, '申時': 16, '酉時': 18, '戌時': 20, '亥時': 22
    };
    const hour = hourMap[timeStr.substring(0, 2)] || 0;
    
    const solar = Solar.fromYmdHms(year, month, day, hour, 0, 0);
    const lunar = solar.getLunar();
    const baZi = lunar.getEightChar();
    
    return [
      { label: '年柱', stem: baZi.getYearGan(), branch: baZi.getYearZhi() },
      { label: '月柱', stem: baZi.getMonthGan(), branch: baZi.getMonthZhi() },
      { label: '日柱', stem: baZi.getDayGan(), branch: baZi.getDayZhi() },
      { label: '時柱', stem: baZi.getTimeGan(), branch: baZi.getTimeZhi() }
    ];
  } catch (e) {
    console.error("Local Pillar Calculation Error:", e);
    return null;
  }
};

export const calculateBaziFortune = async (data: {
  birthDate: string;
  birthTime: string;
  gender: string;
  customQuestion?: string;
}) => {
  try {
    const ai = getAiInstance();
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 4;
    const endYear = currentYear + 4;

    const exactPillars = getExactPillars(data.birthDate, data.birthTime);
    if (!exactPillars) throw new Error("曆法計算模組異常");

    const factSummary = exactPillars.map(p => `${p.label}：${p.stem}${p.branch}`).join('，');

    const prompt = `[命理大師深度排盤請求]
    事實干支：${factSummary}
    性別：${data.gender === 'male' ? '男' : '女'}
    出生日期：${data.birthDate}
    指定諮詢：${data.customQuestion || "整體運勢"}

    請進行深度分析並返回JSON：
    1. **格局判定**：分析日主強弱，明確喜用神與忌神。
    2. **本命分析**：包含性格特質、總體運勢趨勢、喜用五行、人生注意事項。
    3. **流年細論 (${startYear}-${endYear})**：
       - 重點標籤 (Highlights)
       - **五大範疇分析 (Cats)**：每一年的 cats 陣列必須固定包含且僅包含：財富, 事業, 愛情, 家庭, 健康。
    輸出必須為合法 JSON 格式。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash", 
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bazi: {
              type: Type.OBJECT,
              properties: {
                pillars: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      stem: { type: Type.STRING },
                      branch: { type: Type.STRING },
                      stemGod: { type: Type.STRING },
                      branchGod: { type: Type.STRING },
                      element: { type: Type.STRING }
                    }
                  }
                },
                currentDaYun: { type: Type.STRING },
                dayMasterDesc: { type: Type.STRING },
                personality: { type: Type.STRING, description: "本命性格分析" },
                generalFortune: { type: Type.STRING, description: "人生總體運勢概述" },
                warnings: { type: Type.STRING, description: "應特別注意的地方" },
                favorableElements: { type: Type.STRING, description: "喜用神與開運建議" },
                energyScores: {
                  type: Type.OBJECT,
                  properties: {
                    wood: { type: Type.INTEGER },
                    fire: { type: Type.INTEGER },
                    earth: { type: Type.INTEGER },
                    metal: { type: Type.INTEGER },
                    water: { type: Type.INTEGER }
                  }
                }
              },
              required: ["pillars", "currentDaYun", "dayMasterDesc", "energyScores", "personality", "generalFortune", "warnings", "favorableElements"]
            },
            shortFortune: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  year: { type: Type.INTEGER },
                  lunar: { type: Type.STRING },
                  zodiac: { type: Type.STRING },
                  element: { type: Type.STRING },
                  highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                  score: { type: Type.INTEGER },
                  summary: { type: Type.STRING },
                  logic: { type: Type.STRING },
                  cats: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        n: { type: Type.STRING },
                        s: { type: Type.INTEGER },
                        d: { type: Type.STRING }
                      }
                    }
                  }
                },
                required: ["year", "score", "highlights", "logic", "cats"]
              }
            }
          },
          required: ["bazi", "shortFortune"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI 無法生成內容，請重試。");
    const parsed = JSON.parse(cleanJsonString(text));
    
    if (parsed.bazi && parsed.bazi.pillars) {
        parsed.bazi.pillars = exactPillars.map((exact, i) => {
            const aiData = parsed.bazi.pillars[i] || {};
            return {
                ...aiData,
                label: exact.label,
                stem: exact.stem,
                branch: exact.branch,
                element: getElementFromStem(exact.stem),
                stemGod: aiData.stemGod || "十神",
                branchGod: aiData.branchGod || "地支"
            };
        });
    }

    return parsed;
  } catch (error) {
    console.error("Bazi engine failure:", error);
    throw error;
  }
};

/**
 * 針對心中所問進行極度深度的專項分析
 */
export const getSpecialInquiryAnalysis = async (params: {
  birthData: any;
  question: string;
  baziContext: string;
}) => {
  try {
    const ai = getAiInstance();
    const today = new Date();
    const currentYear = today.getFullYear();
    const nextYear = currentYear + 1;
    
    const prompt = `[心中所問 - 深度專項命理報告]
    當前系統日期：${today.toLocaleDateString()} (西元 ${currentYear} 年)
    命主背景：${params.baziContext}
    諮詢問題：${params.question}

    【 重要指令 - 格式規範 】：
    1. **絕對禁止** 使用任何 Markdown 符號。不可出現 "#", "##", "*", "**", "_", "-", ">" 等。
    2. 使用中文標題符號：請用「【 標題 】」表示大標題，用「◎ 子標題」表示小標題，用「●」表示重點項目。
    3. 段落間請保持 2 個換行，使版面疏朗易讀。
    4. 語氣需溫潤如大師親授，不可有科技感或代碼感。
    5. 如果使用者問「明年」，指的絕對是西元 ${nextYear} 年。

    報告結構要求：
    【 命理因果解析 】：分析此問題（${params.question}）在命盤中的根源。
    【 目標年份詳細推演 】：針對關聯年份（如：${nextYear}年）的具體吉凶建議。
    【 錦囊行動方針 】：具體的趨吉備凶方法。
    【 大師心法導引 】：最後的智慧點撥。

    請以繁體中文撰寫。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash", 
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Special inquiry error:", error);
    return "【 系統訊息 】\n大師正閉關修煉中，暫時無法提供深度建議。";
  }
};

export const generateEmailSummary = async (params: {
  question: string;
  summary: string;
  name?: string;
}) => {
  try {
    const ai = getAiInstance();
    const prompt = `請以一名溫暖且專業的命理大師身分，為使用者撰寫一份簡短的郵件正文。
    
    【格式要求】
    1. 禁止使用 Markdown 符號（如 #, *, **）。
    2. 使用純文字與中文符號。
    3. 郵件開頭親切，結尾祝福。
    
    使用者問題：${params.question || "整體運勢"}
    分析摘要：${params.summary}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error("Email summary error:", error);
    return `這是您的八字流年分析報告摘要：\n\n${params.summary}`;
  }
};

/**
 * 專項領域深度分析：結合八字背景與流年邏輯
 */
export const getDetailedCategoryAnalysis = async (params: {
  baziContext: string;
  year: string;
  category: string;
  logic: string;
}) => {
  try {
    const ai = getAiInstance();
    const prompt = `[大師流年深度專題分析]
    命主八字背景：${params.baziContext}
    目標年份：${params.year}
    分析範疇：${params.category}
    該年命理邏輯摘要：${params.logic}

    【 鑑定要求 】：
    1. 請結合命主的「八字原局」、「當前大運」與「${params.year}流年干支」，針對「${params.category}」進行極致深度的解析。
    2. 分析此範疇在該年的吉凶轉折點、潛在風險與獲益機會。
    3. 提供 3 條具體的開運或避險錦囊。
    4. 語氣需如命理宗師，專業、溫潤且具備洞察力。
    5. **絕對禁止** 使用任何 Markdown 符號（如 #, *, **）。使用中文標題與符號。

    請以繁體中文撰寫。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash", 
      contents: prompt,
      config: { 
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Deep dive error:", error);
    throw error;
  }
};

export const generatePrizeImage = async (prizeName: string): Promise<string | null> => {
  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `A high quality 3D stylized icon of ${prizeName}, soft lighting, studio background.` }] }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
};

export const transformImageStyle = async (base64Data: string, mimeType: string, prompt: string): Promise<string | null> => {
  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Data.split(',')[1] || base64Data, mimeType } },
          { text: prompt }
        ]
      },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    console.error("Style transform error:", error);
    return null;
  }
};
