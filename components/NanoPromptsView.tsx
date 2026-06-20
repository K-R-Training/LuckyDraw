
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { transformImageStyle } from '../services/geminiService';

interface PromptItem {
  id: string;
  category: string;
  title: string;
  prompt: string;
  tag: string;
  imageUrl: string;
}

const PROMPT_DATA: PromptItem[] = [
  // --- 27 日本動漫大師風格 (Master Styles) ---
  { id: 'm1', category: '大師風格庫', title: '吉卜力工作室風格 (Studio Ghibli)', tag: 'Ghibli', imageUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=400&auto=format&fit=crop', prompt: 'Studio Ghibli style. Hand-drawn watercolor textures, lush detailed natural backgrounds, warm nostalgic atmosphere, soft lighting, emotive characters.' },
  { id: 'm2', category: '大師風格庫', title: '鳥山明風格 (Akira Toriyama)', tag: 'Toriyama', imageUrl: 'https://images.unsplash.com/photo-1620336655055-088d06e76fb5?q=80&w=400&auto=format&fit=crop', prompt: 'Akira Toriyama art style. Powerful clean lines, high saturation colors, blocky muscular anatomy, dynamic poses, mechanical/biological hybrid designs.' },
  { id: 'm3', category: '大師風格庫', title: '尾田榮一郎風格 (Eiichiro Oda)', tag: 'Oda', imageUrl: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=400&auto=format&fit=crop', prompt: 'Eiichiro Oda style. Exaggerated character proportions and expressions, incredibly dense background details, energetic lines, adventurous spirit.' },
  { id: 'm4', category: '大師風格庫', title: '新海誠風格 (Makoto Shinkai)', tag: 'Shinkai', imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&auto=format&fit=crop', prompt: 'Makoto Shinkai style. Hyper-realistic intricate background art, lens flares, volumetric lighting, high saturation transparent colors, profound emotional atmosphere.' },
  { id: 'm5', category: '大師風格庫', title: 'CLAMP 風格', tag: 'CLAMP', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=400&auto=format&fit=crop', prompt: 'CLAMP manga style. Slender and elongated character proportions, highly decorative outfits, flowing hair, magical and romantic atmosphere, delicate lines.' },
  { id: 'm6', category: '大師風格庫', title: '荒木飛呂彥風格 (Hirohiko Araki)', tag: 'Araki / JoJo', imageUrl: 'https://images.unsplash.com/photo-1558679908-541bcf1249ff?q=80&w=400&auto=format&fit=crop', prompt: 'JoJo\'s Bizarre Adventure style by Hirohiko Araki. Iconic posing (JoJo-dachi), bold psychedelic colors, high-fashion clothing, sharp facial contours, visual onomatopoeia.' },
  { id: 'm7', category: '大師風格庫', title: '井上雄彥風格 (Takehiko Inoue)', tag: 'Inoue', imageUrl: 'https://images.unsplash.com/photo-1502133480873-37d90c1950a4?q=80&w=400&auto=format&fit=crop', prompt: 'Takehiko Inoue realism style. Masterful ink brush strokes, precise human anatomy and movement, deep emotional facial expressions, skilled use of white space.' },
  { id: 'm8', category: '大師風格庫', title: '京都動畫風格 (KyoAni)', tag: 'KyoAni', imageUrl: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=400&auto=format&fit=crop', prompt: 'Kyoto Animation style. Exquisite character art, soft pastel colors, subtle micro-expressions, focus on eyes, airy and delicate atmosphere.' },
  { id: 'm9', category: '大師風格庫', title: 'ufotable 風格', tag: 'ufotable', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop', prompt: 'ufotable movie-quality style. Digital particle effects, cinematic lighting, intense battle scenes, seamless 2D/3D fusion, dramatic shadows.' },
  { id: 'm10', category: '大師風格庫', title: 'TRIGGER 風格', tag: 'TRIGGER', imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400&auto=format&fit=crop', prompt: 'Studio TRIGGER style. Extreme dynamic distortion, high contrast color palettes, bold thick lines, imaginative mecha and silhouettes, high energy.' },
  { id: 'm11', category: '大師風格庫', title: '三浦建太郎風格 (Kentaro Miura)', tag: 'Miura', imageUrl: 'https://images.unsplash.com/photo-1512314889357-e157c22f938d?q=80&w=400&auto=format&fit=crop', prompt: 'Kentaro Miura Berserk style. Dark fantasy aesthetic, incredibly detailed ink hatching on armor and monsters, strong volume and weight, epic composition.' },
  { id: 'm12', category: '大師風格庫', title: '高橋留美子風格 (Rumiko Takahashi)', tag: 'Takahashi', imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=400&auto=format&fit=crop', prompt: 'Rumiko Takahashi style. Rounded faces, large expressive eyes, classic 90s anime look, vibrant comedic expressions, blend of mundane and fantasy.' },
  { id: 'm13', category: '大師風格庫', title: '手塚治虫風格 (Osamu Tezuka)', tag: 'Tezuka', imageUrl: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=400&auto=format&fit=crop', prompt: 'Osamu Tezuka classic style. Simplified curves, iconic large round eyes, expressive character silhouettes, symbolic retro anime aesthetic.' },
  { id: 'm14', category: '大師風格庫', title: '大友克洋風格 (Katsuhiro Otomo)', tag: 'Otomo', imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop', prompt: 'Katsuhiro Otomo Akira style. Realistic human proportions, dense urban background details, cinematic framing, mechanical precision, themes of destruction.' },
  { id: 'm15', category: '大師風格庫', title: '松本大洋風格 (Taiyo Matsumoto)', tag: 'Matsumoto', imageUrl: 'https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?q=80&w=400&auto=format&fit=crop', prompt: 'Taiyo Matsumoto style. Free and distorted lines, surreal compositions, raw emotional tension, unconventional perspective and hatching.' },
  { id: 'm16', category: '大師風格庫', title: '天野喜孝風格 (Yoshitaka Amano)', tag: 'Amano', imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=400&auto=format&fit=crop', prompt: 'Yoshitaka Amano ethereal style. Calligraphy-like flowing lines, dreamlike fantasy elements, intricate decorative patterns, slender elegant characters.' },
  { id: 'm17', category: '大師風格庫', title: '弐瓶勉風格 (Tsutomu Nihei)', tag: 'Nihei', imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=400&auto=format&fit=crop', prompt: 'Tsutomu Nihei BLAME! style. Massive cold architectural structures, post-apocalyptic desolation, biomechanical design, heavy black and white contrast.' },
  { id: 'm18', category: '大師風格庫', title: '士郎正宗風格 (Masamune Shirow)', tag: 'Shirow', imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=400&auto=format&fit=crop', prompt: 'Masamune Shirow Ghost in the Shell style. Precise mechanical settings, strong female leads, cyberpunk aesthetic, detailed technology, clean complex lines.' },
  { id: 'm19', category: '大師風格庫', title: '永野護風格 (Mamoru Nagano)', tag: 'Nagano', imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400&auto=format&fit=crop', prompt: 'Mamoru Nagano Five Star Stories style. Slender characters and Mortar Headd mecha, complex baroque-inspired design, fusion of gothic and art deco.' },
  { id: 'm20', category: '大師風格庫', title: '渡邊信一郎風格 (Shinichiro Watanabe)', tag: 'Watanabe', imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400&auto=format&fit=crop', prompt: 'Shinichiro Watanabe Cowboy Bebop style. Cinematic realism, fusion of music-inspired vibes, fluid action choreography, cool mature atmosphere.' },
  { id: 'm21', category: '大師風格庫', title: '湯淺政明風格 (Masaaki Yuasa)', tag: 'Yuasa', imageUrl: 'https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?q=80&w=400&auto=format&fit=crop', prompt: 'Masaaki Yuasa style. Free-spirited lines and distorted perspectives, vivid unconventional color schemes, stream-of-consciousness visual flow.' },
  { id: 'm22', category: '大師風格庫', title: '出水ぽすか風格 (Posuka Demizu)', tag: 'Demizu', imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop', prompt: 'Posuka Demizu style. Detailed fantastical backgrounds, blend of fairy-tale and dark elements, characters with expressive slightly uneasy features.' },
  { id: 'm23', category: '大師風格庫', title: '貞本義行風格 (Yoshiyuki Sadamoto)', tag: 'Sadamoto', imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop', prompt: 'Yoshiyuki Sadamoto Evangelion style. Slender and chic character silhouettes, melancholic eyes, clean lines, soft muted color palettes.' },
  { id: 'm24', category: '大師風格庫', title: '村田雄介風格 (Yusuke Murata)', tag: 'Murata', imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&auto=format&fit=crop', prompt: 'Yusuke Murata One Punch Man style. Master-level draftsmanship, fluid action sequences, sharp and precise anatomy, full dense compositions.' },

  // --- 玩具與手辦 ---
  { id: 't1', category: '玩具與手辦', title: 'Nano Banana 3D 手辦', tag: '3D Figure', imageUrl: 'https://images.unsplash.com/photo-1558679908-541bcf1249ff?q=80&w=400&auto=format&fit=crop', prompt: 'Turn the person into a 1/7 scale commercialized figure, in a realistic style. Place the figure on a computer desk, using a circular transparent acrylic base.' },
  { id: 't2', category: '玩具與手辦', title: 'Q版毛線娃娃', tag: 'Crochet Chibi', imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=400&auto=format&fit=crop', prompt: 'A close-up photograph of a hand-crocheted yarn doll. Cute chibi image, vivid contrasting colors, rich yarn textures. Warm wooden background.' },
  { id: 't3', category: '玩具與手辦', title: '透明扭蛋膠囊', tag: 'Gashapon', imageUrl: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=400&auto=format&fit=crop', prompt: 'A detailed transparent gashapon capsule diorama. Inside: the character in a stylish pose. Cinematic lighting, colored base.' },
  { id: 't4', category: '玩具與手辦', title: '角色毛絨玩偶', tag: 'Plushie', imageUrl: 'https://images.unsplash.com/photo-1555448049-816dab5554c8?q=80&w=400&auto=format&fit=crop', prompt: 'A soft, high-quality plush toy with an oversized head, small body. Made of fuzzy fabric with visible stitching and embroidered facial features.' },
  { id: 't5', category: '玩具與手辦', title: 'Funko Pop 手辦', tag: 'Funko Pop', imageUrl: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=400&auto=format&fit=crop', prompt: 'A 3D render of a chibi Funko Pop figure. Large head, boxed packaging style. High detail, studio lighting, white background.' },

  // --- 攝影與肖像 ---
  { id: 'p1', category: '攝影風格', title: 'iPhone 自拍', tag: 'iPhone Selfie', imageUrl: 'https://images.unsplash.com/photo-1512314889357-e157c22f938d?q=80&w=400&auto=format&fit=crop', prompt: 'An ordinary and unremarkable iPhone selfie snapshot. Slight motion blur, uneven lighting, messy composition, realistic phone camera aesthetic.' },
  { id: 'p2', category: '攝影風格', title: 'Retro 寶麗來', tag: 'Polaroid', imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop', prompt: 'A Polaroid camera snapshot. Normal photo look, slight blur, flash lighting in a dark room. White curtain background.' },
  { id: 'p3', category: '攝影風格', title: '電影感肖像', tag: 'Cinematic', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop', prompt: 'Vertical portrait shot, stark cinematic lighting, intense contrast. Saturated crimson red background, low angle.' },

  // --- 藝術技術 ---
  { id: 'art1', category: '藝術風格', title: '水墨 / 墨繪風格', tag: 'Sumi-e', imageUrl: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=400&auto=format&fit=crop', prompt: 'Traditional Japanese Sumi-e ink wash style. Expressive brush strokes, ink value gradations, zen-like focus, beautiful use of negative space.' },
  { id: 'art2', category: '藝術風格', title: '像素藝術風格', tag: 'Pixel Art', imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400&auto=format&fit=crop', prompt: 'Retro 16-bit pixel art style. Limited color palette, blocky geometric details, nostalgic game aesthetic.' },
  { id: 'art3', category: '藝術風格', title: '可愛 / Q版風格', tag: 'Kawaii / Chibi', imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop', prompt: 'Kawaii chibi style. 2-3 head body ratio, rounded soft lines, exaggerated cute expressions, bright cheerful colors.' },

  // --- 圖片編輯 ---
  { id: 'e1', category: '圖片編輯', title: '修改背景', tag: 'Background Edit', imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&auto=format&fit=crop', prompt: 'Replace the background with a new description like beach or forest. Keep the main subject unchanged.' },
  { id: 'e2', category: '圖片編輯', title: '表情修改', tag: 'Expression Edit', imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop', prompt: 'Keep the person unchanged but change their facial expression to a big bright smile. Realistic details.' }
];

export const NanoPromptsView: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [userImageMime, setUserImageMime] = useState<string>('');
  const [generationResults, setGenerationResults] = useState<Record<string, string>>({});
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>('大師風格庫');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  // Custom Prompts state (editable)
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>(
    PROMPT_DATA.reduce((acc, item) => ({ ...acc, [item.id]: item.prompt }), {})
  );

  const [selectedEnlarge, setSelectedEnlarge] = useState<{url: string, title: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handlePromptChange = (id: string, newText: string) => {
    setCustomPrompts(prev => ({ ...prev, [id]: newText }));
  };

  const resetPrompt = (id: string) => {
    const original = PROMPT_DATA.find(p => p.id === id);
    if (original) {
      setCustomPrompts(prev => ({ ...prev, [id]: original.prompt }));
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
        alert('請選取圖片檔案。');
        return;
    }
    setUserImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setUserImage(result);
        setGenerationResults({});
      }
    };
    reader.onerror = () => alert('讀取圖片失敗。');
    reader.readAsDataURL(file);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleUrlImport = async () => {
    if (!imageUrl) return;
    setIsImportingUrl(true);
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserImage(reader.result as string);
        setUserImageMime(blob.type || 'image/png');
        setGenerationResults({});
        setShowUrlInput(false);
        setImageUrl('');
        setIsImportingUrl(false);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error(err);
      alert('無法載入圖片連結，建議您下載圖片後手動上傳。');
      setIsImportingUrl(false);
    }
  };

  const handleClearImage = () => {
    setUserImage(null);
    setUserImageMime('');
    setGenerationResults({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Camera Functions
  const openCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, 
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      alert('無法開啟相機，請檢查權限設定。');
      setIsCameraOpen(false);
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
    streamRef.current = null;
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setUserImage(dataUrl);
        setUserImageMime('image/jpeg');
        setGenerationResults({});
        closeCamera();
      }
    }
  };

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) processFile(blob);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processFile]);

  const handleTransform = async (item: PromptItem) => {
    if (!userImage) {
        alert('請先上傳圖片。');
        return;
    }
    const currentPrompt = customPrompts[item.id];
    setLoadingIds(prev => new Set(prev).add(item.id));
    try {
      const result = await transformImageStyle(userImage, userImageMime, currentPrompt);
      if (result) {
        setGenerationResults(prev => ({ ...prev, [item.id]: result }));
      } else {
        alert('生成失敗，請稍後再試。');
      }
    } catch (err) {
      console.error(err);
      alert('AI 處理過程中發生錯誤。');
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleDownload = (base64: string, filename: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = `Style_${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = ['全部', ...Array.from(new Set(PROMPT_DATA.map(p => p.category)))];
  const filteredData = activeCategory === '全部' 
    ? PROMPT_DATA 
    : PROMPT_DATA.filter(p => p.category === activeCategory);

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 scroll-smooth pb-24 relative">
      <div className="w-full max-w-7xl mx-auto p-4 lg:p-12 animate-[fadeIn_0.5s_ease-out]">
        
        {/* Header Section */}
        <div className="mb-12 text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-sm font-bold mb-4 uppercase tracking-wider">
            Gemini 3.0 Powered AI Magic Studio
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">🍌 Nano Banana 旗艦風格庫</h2>
          <p className="text-slate-500 max-w-3xl mx-auto text-lg leading-relaxed mb-10">
            集結 27 位動漫大師、玩具手辦、藝術水墨等多重風格。您可以拍照、上傳或<span className="text-orange-600 font-bold">手動修改提示詞</span>再生成。
          </p>

          {/* Source Image View */}
          {userImage && !isCameraOpen && (
            <div className="max-w-xl mx-auto mb-8 animate-[scaleIn_0.3s_ease-out]">
              <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-orange-100 relative group">
                <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-4">當前處理照片 Source Photo</p>
                <div 
                  className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border-4 border-slate-50 flex items-center justify-center cursor-zoom-in"
                  onClick={() => setSelectedEnlarge({ url: userImage, title: '原始照片' })}
                >
                  <img src={userImage} className="max-w-full max-h-full object-contain" alt="Current Source" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-all shadow-md">更換照片</button>
                  <button onClick={openCamera} className="flex-1 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-all shadow-md flex items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    重新拍照
                  </button>
                  <button onClick={handleClearImage} className="px-4 py-2 bg-rose-50 text-rose-500 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all">清除</button>
                </div>
              </div>
            </div>
          )}

          {/* Upload & Camera Area */}
          {!userImage && !isCameraOpen && (
            <div className="max-w-2xl mx-auto mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-[2.5rem] p-10 border-2 border-dashed border-slate-200 hover:border-orange-400 transition-all cursor-pointer group shadow-sm flex flex-col items-center gap-4"
                     onClick={() => fileInputRef.current?.click()}>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  <p className="text-slate-900 font-black text-lg">上傳或貼上照片</p>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 border-2 border-dashed border-slate-200 hover:border-orange-400 transition-all cursor-pointer group shadow-sm flex flex-col items-center gap-4"
                     onClick={openCamera}>
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <p className="text-slate-900 font-black text-lg">開啟相機拍攝</p>
                </div>
              </div>
              
              <div className="mt-4 flex justify-center gap-2">
                 <button onClick={() => setShowUrlInput(!showUrlInput)} className="text-slate-400 text-xs font-bold hover:text-orange-500 transition-colors">使用網址導入圖片</button>
              </div>
              {showUrlInput && (
                <div className="mt-4 flex gap-2 p-2 bg-white rounded-xl border border-slate-100 animate-[fadeIn_0.2s]">
                  <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="貼上圖片網址..." className="flex-1 px-4 py-2 text-sm outline-none" />
                  <button onClick={handleUrlImport} disabled={isImportingUrl} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold">{isImportingUrl ? '載入中' : '載入'}</button>
                </div>
              )}
            </div>
          )}

          {/* Camera View */}
          {isCameraOpen && (
            <div className="max-w-2xl mx-auto mb-12 animate-[scaleIn_0.3s_ease-out]">
              <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl relative border-4 border-white shadow-orange-200/50">
                <video ref={videoRef} autoPlay playsInline className="w-full aspect-video object-cover" />
                <div className="absolute inset-0 flex flex-col justify-between p-6">
                  <div className="flex justify-end">
                    <button onClick={closeCamera} className="bg-black/50 text-white p-3 rounded-full hover:bg-black/80 transition-all">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="flex justify-center pb-4">
                    <button 
                      onClick={capturePhoto} 
                      className="w-16 h-16 bg-white rounded-full border-4 border-orange-500 shadow-xl flex items-center justify-center active:scale-90 transition-transform group"
                    >
                      <div className="w-10 h-10 bg-orange-500 rounded-full group-hover:scale-95 transition-transform" />
                    </button>
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <p className="mt-4 text-slate-400 text-xs font-bold uppercase tracking-widest">正在使用即時攝像頭</p>
            </div>
          )}

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-16">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-2xl font-bold text-xs transition-all ${
                  activeCategory === cat ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Style Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredData.map(item => (
            <div key={item.id} className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
              <div 
                className="aspect-square relative overflow-hidden bg-slate-900 cursor-zoom-in"
                onClick={() => setSelectedEnlarge({ url: generationResults[item.id] || item.imageUrl, title: item.title })}
              >
                <img src={generationResults[item.id] || item.imageUrl} className={`w-full h-full object-cover transition-all duration-700 ${loadingIds.has(item.id) ? 'opacity-30 blur-sm scale-95' : 'group-hover:scale-110'}`} />
                {loadingIds.has(item.id) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <div className="absolute top-4 left-4"><span className="px-3 py-1 bg-black/40 backdrop-blur-xl border border-white/20 rounded-xl text-white text-[9px] font-black uppercase tracking-wider">{item.tag}</span></div>
                {generationResults[item.id] && !loadingIds.has(item.id) && (
                  <button onClick={(e) => { e.stopPropagation(); handleDownload(generationResults[item.id], item.title); }} className="absolute top-4 right-4 bg-white/90 p-2 rounded-xl shadow-xl transition-all hover:scale-110"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-black text-slate-900 text-sm truncate pr-2">{item.title}</h4>
                  <button onClick={() => resetPrompt(item.id)} className="text-[10px] text-slate-400 hover:text-orange-500 font-bold whitespace-nowrap transition-colors">恢復預設</button>
                </div>
                <textarea 
                  value={customPrompts[item.id]}
                  onChange={(e) => handlePromptChange(item.id, e.target.value)}
                  className="w-full h-20 p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-600 focus:ring-1 focus:ring-orange-400 outline-none resize-none mb-4 leading-relaxed transition-all"
                  placeholder="編輯 AI 咒語..."
                />
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => handleCopy(item.id, customPrompts[item.id])} className="flex-1 py-2 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-bold hover:bg-slate-100">複製</button>
                  <button onClick={() => handleTransform(item)} disabled={!userImage || loadingIds.has(item.id)} className={`flex-[2.5] py-2 rounded-lg text-[10px] font-black shadow-sm transition-all ${!userImage ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white hover:bg-orange-600 active:scale-95'}`}>{loadingIds.has(item.id) ? '處理中' : '套用風格'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedEnlarge && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-sm p-4 animate-[fadeIn_0.2s] cursor-zoom-out" onClick={() => setSelectedEnlarge(null)}>
          <div className="relative max-w-5xl max-h-full flex flex-col items-center gap-4 animate-[scaleIn_0.3s]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20"><img src={selectedEnlarge.url} className="max-w-full max-h-[80vh] object-contain block" /></div>
            <div className="text-center px-4">
               <h3 className="text-white font-black text-xl tracking-wide">{selectedEnlarge.title}</h3>
               {selectedEnlarge.url.startsWith('data:image') && (
                 <button 
                  onClick={() => handleDownload(selectedEnlarge.url, selectedEnlarge.title)}
                  className="mt-2 text-white/50 hover:text-white text-xs font-bold underline transition-colors"
                 >
                   下載此張照片
                 </button>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
