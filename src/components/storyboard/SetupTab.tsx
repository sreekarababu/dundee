import React, { useState } from 'react';
import { FileText, Upload, Wand2, Loader2, Sparkles, Star, LayoutTemplate, X, Activity } from 'lucide-react';
import { 
  IMAGE_STYLES, CINEMATIC_TONES, COLOR_PALETTES, CAMERAS, 
  LENS_GROUPS, TIME_OF_DAY, GENRE_PRESETS, AI_DIRECTORS, 
  FILM_STOCKS, DIFFUSION_FILTERS, DOF_STYLES, BOARD_STYLES 
} from '../../constants/dundee';

interface SetupTabProps {
  script: string;
  setScript: (s: string) => void;
  projectName: string;
  setProjectName: (s: string) => void;
  scriptLanguage: string;
  setScriptLanguage: (s: string) => void;
  selectedStyle: string;
  setSelectedStyle: (s: string) => void;
  aspectRatio: string;
  setAspectRatio: (s: string) => void;
  selectedTone: string;
  setSelectedTone: (s: string) => void;
  selectedPalette: string;
  setSelectedPalette: (s: string) => void;
  selectedGlobalCamera: string;
  setSelectedGlobalCamera: (s: string) => void;
  selectedGlobalLensGroup: string;
  setSelectedGlobalLensGroup: (s: string) => void;
  selectedGlobalTime: string;
  setSelectedGlobalTime: (s: string) => void;
  selectedDirector: string;
  setSelectedDirector: (s: string) => void;
  selectedFilmStock: string;
  setSelectedFilmStock: (s: string) => void;
  selectedDiffusion: string;
  setSelectedDiffusion: (s: string) => void;
  selectedDof: string;
  setSelectedDof: (s: string) => void;
  selectedBoardStyle: string;
  setSelectedBoardStyle: (s: string) => void;
  enforceContinuity: boolean;
  setEnforceContinuity: (b: boolean) => void;
  extractScenes: (text: string) => void;
  isAnalyzingDna: boolean;
  dnaUrl: string;
  setDnaUrl: (s: string) => void;
  handleAnalyzeDna: (file: File | null, url: string) => void;
  handleScriptUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function SetupTab({
  script, setScript,
  projectName, setProjectName,
  scriptLanguage, setScriptLanguage,
  selectedStyle, setSelectedStyle,
  aspectRatio, setAspectRatio,
  selectedTone, setSelectedTone,
  selectedPalette, setSelectedPalette,
  selectedGlobalCamera, setSelectedGlobalCamera,
  selectedGlobalLensGroup, setSelectedGlobalLensGroup,
  selectedGlobalTime, setSelectedGlobalTime,
  selectedDirector, setSelectedDirector,
  selectedFilmStock, setSelectedFilmStock,
  selectedDiffusion, setSelectedDiffusion,
  selectedDof, setSelectedDof,
  selectedBoardStyle, setSelectedBoardStyle,
  enforceContinuity, setEnforceContinuity,
  extractScenes,
  isAnalyzingDna,
  dnaUrl, setDnaUrl,
  handleAnalyzeDna,
  handleScriptUpload
}: SetupTabProps) {
  const [isDirectorDropdownOpen, setIsDirectorDropdownOpen] = useState(false);
  const [directorSearchQuery, setDirectorSearchQuery] = useState('');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full">
      {/* LEFT: Script & Project Info */}
      <div className="lg:col-span-5 xl:col-span-4 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-5 flex flex-col shrink-0 min-h-[600px] lg:h-[calc(100vh-160px)] lg:sticky lg:top-32">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-black flex items-center gap-2 text-zinc-300 uppercase tracking-widest">
            <FileText className="w-4 h-4 text-zinc-500" /> Source Data
          </h2>
          <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 border border-zinc-700/50">
            <Upload className="w-3.5 h-3.5" /> Upload File
            <input type="file" accept=".txt,.md,.csv,.fountain,.pdf,.doc,.docx,image/*" className="hidden" onChange={handleScriptUpload} />
          </label>
        </div>
        
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Project Title</label>
            <input 
              type="text" 
              value={projectName} 
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 text-zinc-200 transition-all font-bold"
              placeholder="Untitled Project"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Script Language</label>
            <select 
              value={scriptLanguage} 
              onChange={(e) => setScriptLanguage(e.target.value)} 
              className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 text-white transition-all"
            >
              <option value="Auto-Detect Native Language">Auto-Detect / Keep Original</option>
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="Hindi">Hindi</option>
              <option value="Tamil">Tamil</option>
              <option value="Telugu">Telugu</option>
              <option value="Malayalam">Malayalam</option>
              <option value="Korean">Korean</option>
              <option value="Japanese">Japanese</option>
              <option value="Mandarin">Mandarin</option>
            </select>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Screenplay Parsing</label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Paste text/fountain or upload script file..."
              className="flex-1 w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4 text-[13px] focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 resize-none overflow-y-auto custom-scrollbar transition-all text-zinc-300 font-mono leading-relaxed"
            />
          </div>
          <button onClick={() => extractScenes(script)} className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-xl py-4 text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm shrink-0">
            <Wand2 className="w-4 h-4" /> Extract Scenes & Auto-Cast
          </button>
        </div>
      </div>

      {/* RIGHT: Aesthetics & Cinematic Settings */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
        {/* DNA Extractor */}
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 flex flex-col shrink-0 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-6 text-zinc-200">
            <Activity className="w-5 h-5 text-purple-500" /> Cinematic DNA Extraction
          </h2>
          
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Paste URL (e.g., YouTube Link or Image Link)..." 
                value={dnaUrl} 
                onChange={(e) => setDnaUrl(e.target.value)} 
                className="flex-1 bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 text-zinc-200"
              />
              <button 
                onClick={() => handleAnalyzeDna(null, dnaUrl)} 
                disabled={isAnalyzingDna || !dnaUrl.trim()}
                className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-zinc-700"
              >
                Scan Link
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-800"></div>
              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">OR</span>
              <div className="flex-1 h-px bg-zinc-800"></div>
            </div>
            <label className="cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border border-emerald-500/30">
              <Upload className="w-4 h-4" /> Upload Media Reference (Video/Img)
              <input 
                type="file" 
                accept="video/*,image/*" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files) handleAnalyzeDna(e.target.files[0], '');
                }} 
              />
            </label>
          </div>
          {isAnalyzingDna && (
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/5 py-3 rounded-xl border border-emerald-500/10">
              <Loader2 className="w-4 h-4 animate-spin" /> Sequencing Cinematic DNA Data...
            </div>
          )}
        </div>

        {/* Style Directives */}
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 flex flex-col shrink-0">
          <h2 className="text-sm font-black flex items-center gap-2 mb-6 text-zinc-300 uppercase tracking-widest">
            <LayoutTemplate className="w-5 h-5 text-zinc-500" /> Global Style Directives
          </h2>
          
          <div className="space-y-5">
            {/* AI Director Dropdown/Search */}
            <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-4 shadow-inner">
              <label className="text-xs font-bold text-emerald-500 uppercase tracking-widest block mb-2.5 flex items-center gap-1.5">
                <Star className="w-4 h-4" /> AI Director Mode
              </label>
              <div className="relative">
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={isDirectorDropdownOpen ? directorSearchQuery : (selectedDirector === 'None / Auto' ? '' : selectedDirector)}
                    onChange={(e) => {
                      setDirectorSearchQuery(e.target.value);
                      if (!isDirectorDropdownOpen) setIsDirectorDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setIsDirectorDropdownOpen(true);
                      setDirectorSearchQuery(selectedDirector === 'None / Auto' ? '' : selectedDirector);
                    }}
                    placeholder="Search legendary director or film style..."
                    className="flex-1 bg-zinc-950 border border-emerald-900/50 rounded-xl pl-4 pr-10 py-3.5 text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.05)] placeholder:text-zinc-650"
                  />
                  {selectedDirector !== 'None / Auto' && !isDirectorDropdownOpen && (
                    <button 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-emerald-400 p-1.5 bg-zinc-950 rounded-md"
                      onClick={() => { setSelectedDirector('None / Auto'); setDirectorSearchQuery(''); }}
                      title="Clear Director"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {isDirectorDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-emerald-900/50 rounded-xl shadow-2xl max-h-72 overflow-y-auto custom-scrollbar flex flex-col">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-800">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Select Reference</span>
                      <button onClick={() => setIsDirectorDropdownOpen(false)} className="text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
                    </div>

                    <div 
                      className="px-4 py-3 text-sm font-bold text-zinc-400 hover:bg-emerald-900/40 hover:text-emerald-400 cursor-pointer transition-colors border-b border-zinc-800/50"
                      onClick={() => { setSelectedDirector('None / Auto'); setIsDirectorDropdownOpen(false); setDirectorSearchQuery(''); }}
                    >
                      None / Auto
                    </div>

                    <div className="px-4 py-2 text-[10px] font-black text-zinc-500 bg-zinc-950/50 uppercase tracking-widest border-b border-zinc-800/50">Quick Picks</div>
                    {AI_DIRECTORS.filter(d => d !== 'None / Auto' && d.toLowerCase().includes(directorSearchQuery.toLowerCase())).map(director => (
                      <div 
                        key={director}
                        className="px-4 py-3 text-sm text-zinc-300 hover:bg-emerald-900/40 hover:text-emerald-400 cursor-pointer transition-colors"
                        onClick={() => { setSelectedDirector(director); setIsDirectorDropdownOpen(false); }}
                      >
                        {director}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Format Parameters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Aesthetic Base</label>
                <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                  {IMAGE_STYLES.map((style) => <option key={style} value={style}>{style}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Format Ratio</label>
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                  {['2.39:1', '1.85:1', '21:9', '2:1', '16:9', '1.66:1', '4:3', '3:4', '9:16', '1:1'].map((ratio) => <option key={ratio} value={ratio}>{ratio}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Cinematic Tone</label>
                <select value={selectedTone} onChange={(e) => setSelectedTone(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                  {CINEMATIC_TONES.map((tone) => <option key={tone} value={tone}>{tone}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Color Grading</label>
                <select value={selectedPalette} onChange={(e) => setSelectedPalette(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                  {COLOR_PALETTES.map((palette) => <option key={palette} value={palette}>{palette}</option>)}
                </select>
              </div>
            </div>

            {/* Cameras & Lenses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Global Camera</label>
                <select value={selectedGlobalCamera} onChange={(e) => setSelectedGlobalCamera(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                  {CAMERAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Global Lens Group</label>
                <select value={selectedGlobalLensGroup} onChange={(e) => setSelectedGlobalLensGroup(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                  <option value="Auto / Any">Auto / Any</option>
                  {Object.keys(LENS_GROUPS).map((group) => <option key={group} value={group}>{group}</option>)}
                </select>
              </div>
            </div>

            {/* Time of Day */}
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Global Time of Day</label>
              <select value={selectedGlobalTime} onChange={(e) => setSelectedGlobalTime(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                {TIME_OF_DAY.map((time) => <option key={time} value={time}>{time}</option>)}
              </select>
            </div>

            {/* One-Tap Genre Presets */}
            <div className="pt-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Genre Presets (one-tap look)</label>
              <div className="flex flex-wrap gap-2">
                {GENRE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setSelectedStyle(preset.style);
                      setSelectedTone(preset.tone);
                      setSelectedPalette(preset.palette);
                      setSelectedGlobalTime(preset.time);
                    }}
                    className="bg-zinc-800 hover:bg-emerald-500/20 border border-zinc-700 hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-300 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Analog Film Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Film Stock / Emulation</label>
                <select value={selectedFilmStock} onChange={(e) => setSelectedFilmStock(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                  {FILM_STOCKS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Diffusion / Filtration</label>
                <select value={selectedDiffusion} onChange={(e) => setSelectedDiffusion(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                  {DIFFUSION_FILTERS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Depth of Field</label>
                <select value={selectedDof} onChange={(e) => setSelectedDof(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                  {DOF_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Board Render Style</label>
                <select value={selectedBoardStyle} onChange={(e) => setSelectedBoardStyle(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 text-white transition-all">
                  {BOARD_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Continuity Toggle */}
            <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-700/60 rounded-xl px-4 py-3.5">
              <div>
                <p className="text-sm font-bold text-zinc-200">Shot-to-Shot Continuity</p>
                <p className="text-[10px] text-zinc-500 leading-relaxed mt-0.5">Feed the previous rendered frame as a reference so characters, wardrobe & lighting stay consistent.</p>
              </div>
              <button
                onClick={() => setEnforceContinuity(!enforceContinuity)}
                className={`shrink-0 ml-4 w-12 h-7 rounded-full transition-all relative ${enforceContinuity ? 'bg-emerald-500' : 'bg-zinc-700'}`}
              >
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${enforceContinuity ? 'left-6' : 'left-1'}`}></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
