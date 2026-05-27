import React, { useState, useEffect, useRef } from 'react';
import { 
  Link, Cpu, Book, Search, Key, Globe, Activity, Terminal, 
  Check, AlertTriangle, Volume2, Play, Square, ArrowRight, BookOpen, Layers
} from 'lucide-react';

interface OpenStaxBook {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  coverUrl: string;
}

interface IntegrationsControlProps {
  onImportPage: (text: string, title: string, id: string, page: number) => void;
  azureConfig: {
    key: string;
    region: string;
    voice: string;
    isEnabled: boolean;
  };
  setAzureConfig: React.Dispatch<React.SetStateAction<{
    key: string;
    region: string;
    voice: string;
    isEnabled: boolean;
  }>>;
  setActiveTab: (tab: string) => void;
}

export default function IntegrationsControl({ 
  onImportPage, 
  azureConfig, 
  setAzureConfig,
  setActiveTab 
}: IntegrationsControlProps) {
  
  // OpenStax Textbook Registry States
  const [books, setBooks] = useState<OpenStaxBook[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<OpenStaxBook[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBook, setSelectedBook] = useState<OpenStaxBook | null>(null);
  
  const [chapter, setChapter] = useState<number>(3);
  const [sectionPage, setSectionPage] = useState<number>(1);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importedStatus, setImportedStatus] = useState<string>('');
  const [importedTextPreview, setImportedTextPreview] = useState<string>('');

  // Azure Speech Hub Settings
  const [azureKey, setAzureKey] = useState<string>(azureConfig.key);
  const [azureRegion, setAzureRegion] = useState<string>(azureConfig.region);
  const [azureVoice, setAzureVoice] = useState<string>(azureConfig.voice);
  const [azureActive, setAzureActive] = useState<boolean>(azureConfig.isEnabled);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  
  // Testing Audio States
  const [isTestingSpeech, setIsTestingSpeech] = useState<boolean>(false);
  const [speechConsoleLogs, setSpeechConsoleLogs] = useState<string[]>([]);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);

  // Load books list on register initialization
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch('/api/books/openstax-list');
        const data = await response.json();
        if (data.books) {
          setBooks(data.books);
          setFilteredBooks(data.books);
          // Auto select first book as active
          if (data.books.length > 0) {
            setSelectedBook(data.books[0]);
          }
        }
      } catch (err) {
        console.error("OpenStax connection disrupted:", err);
      }
    };
    fetchBooks();
  }, []);

  // Filter books list based on category & search text query
  useEffect(() => {
    let list = books;
    if (selectedCategory !== 'All') {
      list = list.filter(b => b.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (searchQuery.trim()) {
      list = list.filter(b => 
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredBooks(list);
  }, [searchQuery, selectedCategory, books]);

  // Categories list
  const categories = ['All', 'Economics', 'Business', 'Science', 'Math', 'Humanities'];

  // Trigger OpenStax book content fetch handler
  const handleImportOpenStaxPage = async () => {
    if (!selectedBook) return;

    setIsImporting(true);
    setImportedStatus('Locating OER textbook server nodes...');
    setImportedTextPreview('');

    try {
      const resp = await fetch(`/api/books/openstax-fetch?bookSlug=${selectedBook.slug}&chapter=${chapter}&page=${sectionPage}`);
      const data = await resp.json();
      
      if (data.success) {
        setTimeout(() => {
          setImportedStatus(`Cleaned visual layouts. Retrieved ${data.text.length} characters.`);
          setImportedTextPreview(data.text);
          setIsImporting(false);
        }, 1200);
      } else {
        setImportedStatus('Error retrieving materials. Target page invalid.');
        setIsImporting(false);
      }
    } catch (err) {
      setImportedStatus('Connection timeout. Fallback enabled.');
      setIsImporting(false);
    }
  };

  // Push OpenStax textbook to Live Sandbox Flow
  const handleExportToSandbox = () => {
    if (!selectedBook || !importedTextPreview) return;
    onImportPage(importedTextPreview, selectedBook.title, selectedBook.slug, chapter);
    setActiveTab('sandbox');
  };

  // Update Azure Credentials Helper
  const handleSaveAzureConfig = (enabledState: boolean = azureActive) => {
    setAzureConfig({
      key: azureKey,
      region: azureRegion,
      voice: azureVoice,
      isEnabled: enabledState
    });
    setAzureActive(enabledState);
  };

  // Run Test Speech Synthesis through Azure REST or fallback local synthesizer
  const handleTestAzureSpeech = async () => {
    if (isTestingSpeech) {
      if (activeAudio) {
        activeAudio.pause();
        setActiveAudio(null);
      }
      window.speechSynthesis.cancel();
      setIsTestingSpeech(false);
      return;
    }

    const testText = "Vox Aeterna Cognitive Integration verified. Connected to Azure Speech Hub.";
    const logs: string[] = [];
    
    logs.push("⏳ Initializing cognitive synthesis handshake...");
    logs.push(`🗣️ Target voice selector: ${azureVoice}`);
    setSpeechConsoleLogs([...logs]);

    if (!azureKey || !azureRegion) {
      // Direct offline fallback synthesis
      logs.push("⚠️ Missing subscription key or region.");
      logs.push("📢 Triggering client-side HTML5 SpeechSynthesis fallback...");
      setSpeechConsoleLogs([...logs]);
      
      setIsTestingSpeech(true);
      const utterance = new SpeechSynthesisUtterance(testText);
      utterance.rate = speechRate;
      
      // Select best voice candidate matching target voice prefix
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(v => v.lang.startsWith(azureVoice.substring(0, 2)));
      if (match) utterance.voice = match;

      utterance.onend = () => {
        logs.push("✅ Standard vocalization playback complete.");
        setSpeechConsoleLogs([...logs]);
        setIsTestingSpeech(false);
      };

      utterance.onerror = () => {
        logs.push("❌ Fallback synthesizer aborted.");
        setSpeechConsoleLogs([...logs]);
        setIsTestingSpeech(false);
      };

      window.speechSynthesis.speak(utterance);
      return;
    }

    // Active Proxy endpoint for Azure 
    setIsTestingSpeech(true);
    setIsSynthesizing(true);
    logs.push("🌐 Shipping SSML envelope payload to server proxy...");
    logs.push(`🔌 Region route: https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`);
    setSpeechConsoleLogs([...logs]);

    try {
      const resp = await fetch('/api/speech/azure-synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          key: azureKey,
          region: azureRegion,
          voice: azureVoice
        })
      });

      if (!resp.ok) {
        throw new Error(`External Speech Port error: ${resp.status}`);
      }

      logs.push("🎉 Connection approved! Streaming binary raw audio/mpeg payload...");
      setSpeechConsoleLogs([...logs]);

      const blob = await resp.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.playbackRate = speechRate;
      
      activeAudio?.pause();
      setActiveAudio(audio);
      setIsSynthesizing(false);

      audio.play();
      logs.push("▶️ Playing high quality neural audio stream... (Azure Speech Engine live)");
      setSpeechConsoleLogs([...logs]);

      audio.onended = () => {
        logs.push("✅ Stream playback successfully finalized.");
        setSpeechConsoleLogs([...logs]);
        setIsTestingSpeech(false);
        setActiveAudio(null);
      };

    } catch (err: any) {
      logs.push(`❌ Azure transaction rejected: ${err.message}`);
      logs.push("🚨 Fallback: Booting standard local device browser tts synthesis...");
      setSpeechConsoleLogs([...logs]);
      setIsSynthesizing(false);

      // Perform local speech voice fallback in case key/endpoint times out
      const utterance = new SpeechSynthesisUtterance(testText);
      utterance.rate = speechRate;
      window.speechSynthesis.speak(utterance);
      
      utterance.onend = () => {
        logs.push("✅ Local TTS synthesized backup output successfully.");
        setSpeechConsoleLogs([...logs]);
        setIsTestingSpeech(false);
      };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 font-sans text-white/95 space-y-8">
      
      {/* Title & Connection Summary Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Cpu className="text-[#f27d26] h-6 w-6" />
            External Services & Academic Registries Hub
          </h2>
          <p className="text-xs text-white/50 tracking-wide mt-1">
            Toggle high-fidelity cloud-narrators and import raw messy textbook modules for immediate OCR linearization.
          </p>
        </div>

        {/* Sync panel node statuses */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/5 flex items-center gap-2 text-[10px] font-mono tracking-wider uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>OpenStax OER Registry: <span className="text-emerald-400 font-bold">Online</span></span>
          </div>

          <div className={`px-3 py-1.5 rounded-lg bg-black/60 border flex items-center gap-2 text-[10px] font-mono tracking-wider uppercase ${
            azureActive && azureKey
              ? 'border-emerald-500/20 text-emerald-300'
              : 'border-white/5 text-white/60'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              azureActive && azureKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500 animate-pulse'
            }`}></span>
            <span>Azure Speecher: <span>{azureActive && azureKey ? 'Active (Live REST)' : 'Simulated (Fallback)'}</span></span>
          </div>
        </div>
      </div>

      {/* Primary Integrations Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: MICROSOFT AZURE COGNITIVE SPEECH (Span 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 shadow-xl space-y-5">
            
            <div className="flex justify-between items-start border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-950/40 border border-sky-500/20 rounded-lg text-sky-400">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-widest text-[#f27d26]">Microsoft Azure Speech Hub</h3>
                  <span className="text-[10px] text-white/40 block">Neural Voice Synthesis Engine</span>
                </div>
              </div>

              {/* Toggle speech integration isEnabled state */}
              <button 
                onClick={() => {
                  const newState = !azureActive;
                  setAzureActive(newState);
                  handleSaveAzureConfig(newState);
                }}
                className={`text-[9px] uppercase tracking-wider px-2.5 py-1 rounded transition-all font-mono font-bold cursor-pointer ${
                  azureActive
                    ? 'bg-[#f27d26] text-black shadow-xs'
                    : 'bg-white/5 border border-white/10 text-white/50'
                }`}
              >
                {azureActive ? 'Active' : 'Disabled'}
              </button>
            </div>

            {/* Azure Config Fields */}
            <div className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase text-white/55 block tracking-wider flex items-center justify-between">
                  <span>Azure SDK Subscription Key</span>
                  <span className="text-[8px] text-white/35 uppercase tracking-normal font-sans italic">saved in local session</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter speech API key..."
                    value={azureKey}
                    onChange={(e) => {
                      setAzureKey(e.target.value);
                      // Auto-update global config
                      setAzureConfig(prev => ({ ...prev, key: e.target.value }));
                    }}
                    className="w-full text-xs p-3 bg-black border border-white/10 rounded-xl focus:outline-hidden focus:border-[#f27d26] text-white/95 font-mono leading-none"
                  />
                  <div className="absolute top-3.5 right-3.5 text-white/20">
                    <Key className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase text-white/55 block tracking-wider">Region Endpoint</label>
                  <select
                    value={azureRegion}
                    onChange={(e) => {
                      setAzureRegion(e.target.value);
                      setAzureConfig(prev => ({ ...prev, region: e.target.value }));
                    }}
                    className="w-full text-xs p-3 bg-black border border-white/10 rounded-xl focus:outline-hidden focus:border-[#f27d26] text-white cursor-pointer"
                  >
                    <option value="eastus">East US (eastus)</option>
                    <option value="westeurope">West Europe (westeurope)</option>
                    <option value="southeastasia">SE Asia (southeastasia)</option>
                    <option value="centralus">Central US (centralus)</option>
                    <option value="francecentral">France Central (francecentral)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase text-white/55 block tracking-wider">Target Voice Profile</label>
                  <select
                    value={azureVoice}
                    onChange={(e) => {
                      setAzureVoice(e.target.value);
                      setAzureConfig(prev => ({ ...prev, voice: e.target.value }));
                    }}
                    className="w-full text-xs p-3 bg-black border border-white/10 rounded-xl focus:outline-hidden focus:border-[#f27d26] text-white cursor-pointer font-semibold"
                  >
                    <option value="en-US-JennyNeural">🇺🇸 Jenny (Neural)</option>
                    <option value="en-US-GuyNeural">🇺🇸 Guy (Neural)</option>
                    <option value="en-GB-RyanNeural">🇬🇧 Ryan (Neural)</option>
                    <option value="es-ES-ElviraNeural">🇪🇸 Elvira (Neural)</option>
                    <option value="es-ES-AlvaroNeural">🇪🇸 Alvaro (Neural)</option>
                    <option value="uk-UA-OstapNeural">🇺🇦 Ostap (Neural)</option>
                    <option value="uk-UA-PolinaNeural">🇺🇦 Polina (Neural)</option>
                  </select>
                </div>
              </div>

              {/* Speech rate controller */}
              <div className="pt-2">
                <div className="flex justify-between items-center text-[10px] text-white/60 mb-2">
                  <span className="font-mono uppercase tracking-widest text-[9px]">Speed Multiplication</span>
                  <span className="font-mono text-white/90 font-bold">{speechRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full accent-[#f27d26] h-1 bg-black rounded-lg appearance-none cursor-pointer"
                />
              </div>

            </div>

            {/* Test Connection Speecher Block */}
            <div className="space-y-3 pt-3 border-t border-white/5">
              <button
                onClick={handleTestAzureSpeech}
                disabled={isSynthesizing}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono uppercase font-bold tracking-wider text-white flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                {isTestingSpeech ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current text-rose-400" />
                    <span>Stop Speech Probe</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current text-[#f27d26]" />
                    <span>Test Connection & Voice</span>
                  </>
                )}
              </button>

              {/* Console log box */}
              <div className="bg-black/90 rounded-xl border border-white/5 p-3 font-mono text-[9px] leading-relaxed text-white/70 space-y-1 shadow-inner h-28 overflow-y-auto">
                <div className="flex items-center gap-1.5 text-white/40 border-b border-white/5 pb-1 mb-1.5 uppercase tracking-wider text-[8px] font-extrabold justify-between">
                  <span className="flex items-center gap-1"><Terminal className="h-3 w-3" /> Azure Speech Log</span>
                  <span className="text-[7px]">Active stream listener</span>
                </div>
                {speechConsoleLogs.length === 0 ? (
                  <span className="text-white/30 italic block">Audio telemetry pipeline silent. Click Test Connection to initiate.</span>
                ) : (
                  speechConsoleLogs.map((log, lIdx) => (
                    <div key={lIdx} className="truncate block font-mono">{log}</div>
                  ))
                )}
                {isSynthesizing && (
                  <div className="flex items-center gap-1.5 text-[#f27d26] animate-pulse font-bold mt-1 text-[8px]">
                    <span className="h-1 rounded-full w-4 bg-[#f27d26] animate-bounce"></span>
                    <span>RECEIVING CLOUD BITSTREAM...</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: OPENSTAX TEXTBOOK LIBRARY EXPLORER (Span 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 shadow-xl space-y-5">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-950/40 border border-orange-500/20 rounded-lg text-[#f27d26]">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-widest text-white">OpenStax OER Textbooks Library</h3>
                  <span className="text-[10px] text-white/40 block">Global Open Educational Resources</span>
                </div>
              </div>

              {/* Category selector capsules */}
              <div className="flex flex-wrap gap-1 max-w-full">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-1 text-[9px] font-mono border rounded-md cursor-pointer transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#f27d26]/10 border-[#f27d26] text-[#f27d26] font-bold'
                        : 'bg-black/40 border-white/5 text-white/50 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Book search input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search other OpenStax books (by titles, categories, isbn...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs p-3 pl-9 bg-black border border-white/10 rounded-xl focus:outline-hidden focus:border-[#f27d26] text-white/95"
              />
              <div className="absolute top-3.5 left-3.5 text-white/30">
                <Search className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Curated list / search layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
              {filteredBooks.length === 0 ? (
                <div className="col-span-2 text-center py-10 text-white/40 italic text-xs border border-dashed border-white/5 rounded-xl">
                  No matching textbooks found in OER registry.
                </div>
              ) : (
                filteredBooks.map(book => {
                  const isSelected = selectedBook?.slug === book.slug;
                  return (
                    <button
                      key={book.id}
                      onClick={() => {
                        setSelectedBook(book);
                        setImportedTextPreview('');
                      }}
                      className={`p-3 rounded-xl text-left border text-xs transition-all flex gap-3 items-start cursor-pointer hover:bg-white/5 ${
                        isSelected
                          ? 'bg-white/5 border-[#f27d26] text-white font-semibold ring-1 ring-[#f27d26]/20'
                          : 'bg-black/40 border-white/5 text-white/60'
                      }`}
                    >
                      <img 
                        src={book.coverUrl} 
                        alt={book.title} 
                        referrerPolicy="no-referrer"
                        className="w-9 h-12 rounded object-cover shadow border border-white/10 shrink-0 select-none bg-black"
                        onError={(e) => {
                          // Fallback layout if svg url breaks or is offline
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="space-y-1 overflow-hidden">
                        <span className="font-bold block tracking-tight truncate text-white">{book.title}</span>
                        <span className="text-[9px] font-mono uppercase bg-black text-[#f27d26] px-1.5 py-0.5 rounded border border-white/5 shrink-0 inline-block">
                          {book.category}
                        </span>
                        <p className="text-[10px] text-white/40 line-clamp-1 truncate">{book.description}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Interactive fetch controller page */}
            {selectedBook && (
              <div className="bg-black/60 rounded-2xl border border-white/5 p-4 grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* Details info */}
                <div className="md:col-span-5 space-y-3">
                  <div className="flex gap-3 items-start">
                    <img
                      src={selectedBook.coverUrl}
                      alt={selectedBook.title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-16 rounded object-cover shadow-lg border border-white/10 shrink-0 bg-black select-none"
                    />
                    <div className="space-y-1 min-w-0">
                      <span className="font-bold text-xs block truncate text-white">{selectedBook.title}</span>
                      <span className="text-[9px] font-mono text-white/40 block">Slug: {selectedBook.slug}</span>
                      <span className="text-[9px] font-mono text-[#f27d26] font-semibold block">{selectedBook.category} index</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/50 leading-relaxed max-h-16 overflow-y-auto">
                    {selectedBook.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[8px] font-mono text-white/40 uppercase block mb-1">Chapter</label>
                      <input
                        type="number"
                        min="1"
                        max="22"
                        value={chapter}
                        onChange={(e) => setChapter(parseInt(e.target.value) || 1)}
                        className="w-full text-xs p-1.5 bg-black border border-white/10 rounded focus:outline-hidden text-white font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-mono text-white/40 uppercase block mb-1">Section/Page</label>
                      <input
                        type="number"
                        min="1"
                        max="40"
                        value={sectionPage}
                        onChange={(e) => setSectionPage(parseInt(e.target.value) || 1)}
                        className="w-full text-xs p-1.5 bg-black border border-white/10 rounded focus:outline-hidden text-white font-mono text-center"
                      />
                    </div>
                  </div>

                  <button
                    id="btn-import-openstax"
                    onClick={handleImportOpenStaxPage}
                    disabled={isImporting}
                    className="w-full py-2 bg-[#f27d26] hover:bg-[#d86a1a] disabled:bg-[#f27d26]/40 text-black rounded-lg text-xs font-black tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    {isImporting ? (
                      <>
                        <span className="h-3 w-3 animate-spin border-2 border-black border-t-transparent rounded-full" />
                        <span>Syncing...</span>
                      </>
                    ) : (
                      <>
                        <span>Fetch OER Content</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Import Text Preview field */}
                <div className="md:col-span-7 flex flex-col justify-between h-52 bg-black/80 rounded-xl border border-white/5 p-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1 mb-1.5 uppercase font-mono text-[8.5px] font-bold text-white/40">
                    <span>OER Importer Workspace</span>
                    <span className="text-[#f27d26] lowercase truncate max-w-[120px]">{importedStatus ? `Status: ${importedStatus}` : 'awaiting fetch'}</span>
                  </div>

                  <div className="flex-1 overflow-y-auto text-[9.5px] font-mono text-white/70 whitespace-pre-wrap pr-1 leading-normal">
                    {importedTextPreview ? (
                      importedTextPreview
                    ) : isImporting ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-white/30 animate-pulse">
                        <span className="text-[9px] font-mono uppercase tracking-widest block mb-1">Connecting endpoint</span>
                        <span>Compiling textbook OCR scrap layers...</span>
                      </div>
                    ) : (
                      <span className="text-white/20 italic block text-center mt-12">
                        Text content empty. Click "Fetch OER Content" to import textbook layout code directly from OpenStax repository logs!
                      </span>
                    )}
                  </div>

                  {importedTextPreview && (
                    <button
                      onClick={handleExportToSandbox}
                      className="mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 hover:glow-orange-sm text-white rounded-lg text-[10px] font-mono uppercase font-black tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-900/30 w-full"
                    >
                      <span>Export to Sandbox Editor</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
