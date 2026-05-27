import React, { useState, useEffect } from 'react';
import { TelemetryLog } from '../types';
import { Play, Square, Sparkles, AlertTriangle, Check, BookOpen, Clock, FileText, Globe, Headphones, HelpCircle, Layers, ShieldAlert, BadgeInfo } from 'lucide-react';

interface LayoutProcessorProps {
  onProcess: (data: {
    book_title: string;
    book_id: string;
    page_number: number;
    raw_text: string;
    target_language: string;
    user_id: string;
    user_tier: string;
    user_name: string;
  }) => Promise<{ text: string; log: TelemetryLog; isCached: boolean }>;
  activeLogs: TelemetryLog[];
  azureConfig?: {
    key: string;
    region: string;
    voice: string;
    isEnabled: boolean;
  };
  importedData?: {
    text: string;
    title: string;
    id: string;
    page: number;
  } | null;
  clearImportedData?: () => void;
}

export default function LayoutProcessor({ 
  onProcess, 
  activeLogs,
  azureConfig,
  importedData,
  clearImportedData
}: LayoutProcessorProps) {
  // Demo messy OCR text scraps to make sandbox immediately usable
  const ocrSamples = [
    {
      title: "Finance & Balance Sheet (Table + Formula)",
      bookTitle: "Modern Corporate Finance Masterclass",
      bookId: "corp_finance",
      pageNum: 12,
      lang: "Ukrainian",
      text: `Page 102. Vol.4. Section 2.5: Financial Metrics. 
Table 2.1: Revenue | Q1 | Q2 | $10m | $15m
---------------------
Formula: Price = Δx / y 
[Footnote 1: Verified against Q4 audited spreadsheets, Oxford Lib Ref 56-2].`
    },
    {
      title: "Legal Precedent (Multi-column & Sidebars)",
      bookTitle: "Introduction to Criminal Law",
      bookId: "law_criminal_101",
      pageNum: 45,
      lang: "Spanish",
      text: `[Sidebar Margin Code: LRC-886] Chapter 4. Page 31.
Two-Column Law Overview:
Column A: Elements of Intent (Mens Rea) 
Column B: Actus Reus Constraints.
A criminal contract requires mutual assent. 
(Footnote 2: See Regina v. Cunningham, 1957, Master Rolls). 
If (intent_level > 5) { return act_validated; }`
    },
    {
      title: "Science & Chemistry (Equations & Math symbols)",
      bookTitle: "OpenStax Principles of Economics",
      bookId: "econ_openstax",
      pageNum: 82,
      lang: "English (Irish Dialect)",
      text: `Chapter 8: Equilibrium Equilibrium. Page 246. 
The balanced formula for equilibrium coefficient:
f(x) = x² + 2.
At stable thermal limit, the water content H₂O converges.
The delta variable Δ represents net system change rate.`
    },
    {
      title: "Computer Science Logic Script",
      bookTitle: "W3Schools JavaScript Core Reference",
      bookId: "js_w3ref",
      pageNum: 5,
      lang: "English",
      text: `[Running Header: Page 14. Module JS-Array]
Loop parameters inside textbook grid:
for (let i = 0; i < array.length; i++) {
  if (array[i] > cutoff) { return index; }
}
Note that the above represents typical binary searching syntax.`
    }
  ];

  const students = [
    { id: 'usr_shevchenko_kyiv', name: 'Hanna Shevchenko (Kyiv)', tier: 'premium', lang: 'Ukrainian' },
    { id: 'usr_oconnor_dublin', name: 'Liam O\'Connor (Dublin)', tier: 'standard', lang: 'English (Irish Dialect)' },
    { id: 'usr_martinez_madrid', name: 'Elena Martinez (Madrid)', tier: 'premium', lang: 'Spanish' },
    { id: 'usr_smith_london', name: 'John Smith (London)', tier: 'payg', lang: 'English' },
  ];

  // User input states
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number>(0);
  const [customText, setCustomText] = useState<string>(ocrSamples[0].text);
  const [bookTitle, setBookTitle] = useState<string>(ocrSamples[0].bookTitle);
  const [bookId, setBookId] = useState<string>(ocrSamples[0].bookId);
  const [pageNumber, setPageNumber] = useState<number>(ocrSamples[0].pageNum);
  const [targetLang, setTargetLang] = useState<string>(ocrSamples[0].lang);
  
  const [currentUser, setCurrentUser] = useState<string>(students[0].id);

  // Layout processing outputs
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [processedResult, setProcessedResult] = useState<string>("");
  const [telemetryResult, setTelemetryResult] = useState<TelemetryLog | null>(null);
  const [isCachedResult, setIsCachedResult] = useState<boolean>(false);

  // Audio speech playback state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [azureAudio, setAzureAudio] = useState<HTMLAudioElement | null>(null);

  // Synchronize OpenStax Imported materials inside local state
  useEffect(() => {
    if (importedData) {
      setCustomText(importedData.text);
      setBookTitle(importedData.title);
      setBookId(importedData.id);
      setPageNumber(importedData.page);
      if (clearImportedData) clearImportedData();
    }
  }, [importedData, clearImportedData]);

  // Set selected sample
  const applySample = (index: number) => {
    setSelectedSampleIndex(index);
    const sample = ocrSamples[index];
    setCustomText(sample.text);
    setBookTitle(sample.bookTitle);
    setBookId(sample.bookId);
    setPageNumber(sample.pageNum);
    setTargetLang(sample.lang);
  };

  // Select profile helper
  const applyUserPersona = (id: string) => {
    setCurrentUser(id);
    const u = students.find(s => s.id === id);
    if (u) {
      setTargetLang(u.lang);
    }
  };

  // Submit translation & layout cleanup to server api
  const triggerLayoutProcessor = async () => {
    if (!customText.trim()) return;
    
    setIsProcessing(true);
    setProcessedResult("");
    setTelemetryResult(null);
    setIsCachedResult(false);

    // Simulated progress steps to enrich student layout visualization
    const steps = [
      "Stripping printing metadata, headers, page numbers...",
      "Merging sidebar floats & multi-column segments into linear stream...",
      "Activating Table Resolver for narration...",
      "Phonetizing mathematical parameters & algebraic expressions...",
      "Invoking Translation Engineer via strict System Prompt rules...",
      "Rendering final TTS-vocalization optimized script..."
    ];

    let stepIdx = 0;
    setLoadingStep(steps[stepIdx]);
    
    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setLoadingStep(steps[stepIdx]);
      }
    }, 900);

    const userObj = students.find(s => s.id === currentUser) || students[3];

    try {
      const response = await onProcess({
        book_title: bookTitle,
        book_id: bookId,
        page_number: pageNumber,
        raw_text: customText,
        target_language: targetLang,
        user_id: userObj.id,
        user_tier: userObj.tier,
        user_name: userObj.name
      });

      clearInterval(interval);
      setProcessedResult(response.text);
      setTelemetryResult(response.log);
      setIsCachedResult(response.isCached);
    } catch (e) {
      console.error(e);
      clearInterval(interval);
      setProcessedResult("[Error: High-fidelity layout compilation failed. Please check network port permissions.]");
    } finally {
      setIsProcessing(false);
    }
  };

  // Standard web TTS synthesis audio playback
  const handleTalkSpeech = async () => {
    if (isSpeaking) {
      if (azureAudio) {
        azureAudio.pause();
        setAzureAudio(null);
      }
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!processedResult) return;

    // Check if Azure Cognitive Speecher is enabled
    if (azureConfig?.isEnabled && azureConfig?.key && azureConfig?.region) {
      setIsSpeaking(true);
      try {
        console.log("Azure Speech active. Initiating server-side binary rendering...");
        const response = await fetch('/api/speech/azure-synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: processedResult,
            key: azureConfig.key,
            region: azureConfig.region,
            voice: azureConfig.voice
          })
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => {
            setIsSpeaking(false);
            setAzureAudio(null);
          };
          audio.onerror = () => {
            setIsSpeaking(false);
            setAzureAudio(null);
          };
          setAzureAudio(audio);
          audio.play();
          return;
        } else {
          console.warn("Azure speech response failed, shifting to WebSpeech Synthesis fallback.");
        }
      } catch (err) {
        console.error("Failed to connect with Azure speech endpoint:", err);
      }
    }

    // Standard client browser speech fallback
    let speakableText = processedResult;

    const utterance = new SpeechSynthesisUtterance(speakableText);
    
    // Choose voice based on target translation
    const voices = window.speechSynthesis.getVoices();
    let preferredLang = 'en-US';
    
    if (targetLang === 'Ukrainian') preferredLang = 'uk-UA';
    else if (targetLang === 'Spanish') preferredLang = 'es-ES';
    else if (targetLang.includes('Irish')) preferredLang = 'en-GB';

    const nativeVoice = voices.find(v => v.lang.startsWith(preferredLang.substring(0, 2)));
    if (nativeVoice) {
      utterance.voice = nativeVoice;
    }

    utterance.rate = 0.95; // Slightly slower layout reading rate for accessibility focus

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setSpeechUtterance(utterance);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleStopSpeech = () => {
    if (azureAudio) {
      azureAudio.pause();
      setAzureAudio(null);
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 font-sans text-white/90">
      
      {/* Visual Instruction Panel info */}
      <div className="mb-6 bg-[#0a0a0a] border border-white/10 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-white/75 glow-orange-sm">
        <BadgeInfo className="text-[#f27d26] h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white block mb-0.5">Academic Layout Linearization Sandbox</span>
          This workspace feeds raw textbooks snippets into an AI Layout translation prompt (using live Gemini model or simulated COGS pipeline). Observe how complex multi-column layouts, margin codes, footnote references, and scientific equations are linearized in real-time to facilitate accessibility voice synthesis.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INPUT WORKSPACE PANEL (Grid span 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Subsection: Simulated Student profile selector */}
          <div className="bg-[#0a0a0a] border border-white/15 rounded-xl p-4 shadow-xl">
            <h4 className="text-xs font-mono uppercase tracking-[0.15em] text-[#f27d26] mb-3 flex items-center gap-1.5 font-bold">
              <Globe className="h-4 w-4 text-[#f27d26]" /> 1. Select Active Student Profile
            </h4>
            
            <div className="grid grid-cols-2 gap-2">
              {students.map(s => {
                const isSelected = currentUser === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => applyUserPersona(s.id)}
                    className={`p-3 rounded-lg text-left transition-all text-xs border ${
                      isSelected
                        ? 'bg-[#f27d26] text-black border-transparent font-bold glow-orange-sm'
                        : 'bg-black/60 text-white/60 border-white/5 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="font-bold block tracking-tight truncate">{s.name.split(' ')[0]} {s.name.split(' ')[1]}</span>
                    <span className={`text-[10px] uppercase block tracking-wider mt-0.5 ${isSelected ? 'text-black/80' : 'text-white/40'}`}>
                      {s.lang.split(' (')[0]} ({s.tier})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subsection: OCR Scrap snippets */}
          <div className="bg-[#0a0a0a] border border-white/15 rounded-xl p-4 shadow-xl space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-[0.14em] text-[#f27d26] flex items-center gap-1.5 font-bold">
              <BookOpen className="h-4 w-4 text-[#f27d26]" /> 2. Messy Textbook OCR Material
            </h4>
            
            <div className="space-y-1.5">
              {ocrSamples.map((sample, idx) => {
                const isSelected = selectedSampleIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => applySample(idx)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-white/5 border-[#f27d26]/60 text-white font-medium ring-1 ring-[#f27d26]/20'
                        : 'bg-black/40 text-white/50 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    <span className="truncate pr-2">{sample.title}</span>
                    <span className="font-mono text-[9px] uppercase bg-black/60 border border-white/10 px-1.5 py-0.5 rounded text-[#f27d26] shrink-0 font-bold">
                      {sample.bookId}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Config metadata fields */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
              <div>
                <label className="text-[9px] text-white/40 font-mono uppercase tracking-wider block mb-1">Book Title</label>
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="w-full text-xs p-2 bg-black border border-white/10 rounded focus:outline-hidden focus:border-[#f27d26] text-white"
                />
              </div>
              <div>
                <label className="text-[9px] text-white/40 font-mono uppercase tracking-wider block mb-1">Page #</label>
                <input
                  type="number"
                  value={pageNumber}
                  onChange={(e) => setPageNumber(parseInt(e.target.value) || 1)}
                  className="w-full text-xs p-2 bg-black border border-white/10 rounded focus:outline-hidden focus:border-[#f27d26] text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[9px] text-white/40 font-mono uppercase tracking-wider block mb-1">Target Language</label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full text-xs p-2 bg-black border border-white/10 rounded focus:border-[#f27d26] text-white cursor-pointer"
                >
                  <option value="Ukrainian">Ukrainian</option>
                  <option value="Spanish">Spanish</option>
                  <option value="English (Irish Dialect)">English (Irish)</option>
                  <option value="English">English</option>
                </select>
              </div>
            </div>
          </div>

          {/* Raw Text Input editor */}
          <div className="bg-[#0a0a0a] border border-white/15 rounded-xl p-4 shadow-xl space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-[0.14em] text-white/60 font-bold">
              3. Raw Source Scrap (Direct Feed)
            </h4>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={5}
              className="w-full p-3 border border-white/10 rounded-xl text-xs font-mono bg-black text-white/95 focus:ring-1 focus:ring-[#f27d26] focus:border-[#f27d26] focus:outline-hidden"
              placeholder="Paste custom messy OCR textbook layout here..."
            />
            
            <button
              id="btn-process-layout"
              onClick={triggerLayoutProcessor}
              disabled={isProcessing}
              className="w-full py-3 bg-[#f27d26] hover:bg-[#d86a1a] disabled:bg-[#f27d26]/40 text-black rounded-xl text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_15px_rgba(242,125,38,0.35)]"
            >
              {isProcessing ? (
                <>
                  <span className="h-3 w-3 animate-spin border-2 border-black border-t-transparent rounded-full" />
                  <span>Synthesizing Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 fill-current text-black" />
                  <span>Optimize & Translate Layout</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* OUTPUT Linearized tts SCREEN (Grid span 7) */}
        <div className="lg:col-span-7 flex flex-col h-full justify-between space-y-6">
          
          {/* Linear output display shell */}
          <div className="bg-[#0a0a0a] border border-white/15 rounded-2xl p-5 shadow-xl flex-1 flex flex-col justify-between min-h-[380px]">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f27d26] glow-orange animate-pulse"></span>
                  <span className="font-sans font-bold text-xs uppercase tracking-[0.15em] text-white">
                    Linearized TTS Script Output
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded border border-white/10 bg-black text-white/50 uppercase">
                    Book: {bookId}
                  </span>
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded border border-white/10 bg-black text-white/50">
                    Page {pageNumber}
                  </span>
                </div>
              </div>

              {/* Display text container */}
              {isProcessing ? (
                /* Dynamic simulated step progress block */
                <div className="h-60 flex flex-col items-center justify-center space-y-4 animate-pulse">
                  <div className="h-10 w-10 flex items-center justify-center">
                    <Clock className="h-6 w-6 animate-spin text-[#f27d26]" />
                  </div>
                  <div className="text-center space-y-2">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">AI Parsing & Alignment Pipeline</span>
                    <span className="text-xs text-white/90 font-medium block px-10">{loadingStep}</span>
                  </div>
                </div>
              ) : processedResult ? (
                /* Output display layout */
                <div className="space-y-4 font-sans text-xs text-white/90 leading-relaxed max-h-[300px] overflow-y-auto pr-2">
                  <div className="p-4 bg-black border border-white/5 rounded-xl font-normal whitespace-pre-wrap leading-relaxed shadow-inner">
                    {processedResult}
                  </div>
                </div>
              ) : (
                /* Blank tutorial placeholder */
                <div className="h-60 flex flex-col items-center justify-center text-center text-white/40 space-y-3">
                  <Headphones className="h-8 w-8 text-[#f27d26] stroke-1" />
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/80">Listening Script Engine</span>
                  <p className="text-[11px] text-white/45 max-w-sm px-6 leading-normal">
                    Choose an OCR material snippet or paste messy multi-column layout data on the left panel, configure student profile constraints, and click layout optimization.
                  </p>
                </div>
              )}
            </div>

            {/* Verbal Audio TTS triggers */}
            {processedResult && !isProcessing && (
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleTalkSpeech}
                    className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSpeaking
                        ? 'bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/30'
                        : 'bg-[#f27d26] text-black font-black shadow-xs hover:bg-[#d86a1a]'
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <Square className="h-3.5 w-3.5 fill-current" />
                        Pause Speech Synthesis
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Speech Synthesis Playback
                      </>
                    )}
                  </button>

                  {isSpeaking && (
                    <button
                      onClick={handleStopSpeech}
                      className="px-3 py-2.5 text-xs font-mono uppercase border border-white/10 bg-black/60 text-white/80 hover:bg-white/5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      Stop
                    </button>
                  )}
                </div>

                <span className="text-[9px] font-mono tracking-wider text-white/40">
                  {isSpeaking ? `Synthesizing ${targetLang} audio...` : `Audio linear ready`}
                </span>
              </div>
            )}
          </div>

          {/* Segment: Cost Ledger breakdown details (Hit vs Miss highlights) */}
          {telemetryResult && (
            <div className={`p-4 border rounded-xl overflow-hidden transition-all duration-300 ${
              isCachedResult 
                ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-100' 
                : 'bg-[#0f0f0f] border-white/10'
            }`}>
              {/* Caching state marker */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                  {isCachedResult ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400 bg-emerald-900/40 rounded-full" />
                      <span className="text-emerald-400 font-bold">LIBRARY CACHE HIT (Bypassed LLM)</span>
                    </>
                  ) : (
                    <span className="text-white/40 uppercase bg-white/5 border border-white/10 px-2 py-0.5 rounded-sm">LIBRARY CACHE MISS (AI Realized)</span>
                  )}
                </span>
                
                <span className="font-mono text-xs font-bold text-white/90">
                  Calculated Cost: <span className={isCachedResult ? "text-emerald-400" : "text-[#f27d26]"}>${telemetryResult.metrics.calculated_cost_usd.toFixed(5)}</span>
                </span>
              </div>

              {/* Data parameters list */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono bg-black p-3 rounded-lg border border-white/5">
                <div>
                  <span className="text-white/45 block uppercase text-[8px] tracking-wider mb-0.5">Input Tokens (Gemini/Claude):</span>
                  <span className="font-bold text-white/90">{telemetryResult.metrics.claude_input_tokens || 0}</span>
                </div>
                <div>
                  <span className="text-white/45 block uppercase text-[8px] tracking-wider mb-0.5">Output Tokens (Gemini/Claude):</span>
                  <span className="font-bold text-white/90">{telemetryResult.metrics.claude_output_tokens || 0}</span>
                </div>
                <div>
                  <span className="text-white/45 block uppercase text-[8px] tracking-wider mb-0.5">Synthesized Characters:</span>
                  <span className="font-bold text-white/90">{telemetryResult.metrics.azure_characters || 0}</span>
                </div>
                <div>
                  <span className="text-white/45 block uppercase text-[8px] tracking-wider mb-0.5">Transaction reference:</span>
                  <span className="font-bold text-white/90 truncate block">{telemetryResult.transaction_id}</span>
                </div>
              </div>

              {isCachedResult && (
                <p className="text-[10px] text-emerald-300 mt-2 font-sans italic leading-normal">
                  Excellent! This textbook content was previously analyzed. Recalling from shared cache repository completely bypasses processing weights to ensure maximal performance.
                </p>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
