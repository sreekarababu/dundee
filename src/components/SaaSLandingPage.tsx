import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, Clapperboard, Camera, Users, MapPin, Play, 
  ArrowRight, Check, Film, Tv, Layers, MessageSquareQuote, ChevronRight 
} from 'lucide-react';

interface SaaSLandingPageProps {
  onOpenAuth: () => void;
  onLaunchGuestMode: () => void;
}

export default function SaaSLandingPage({ onOpenAuth, onLaunchGuestMode }: SaaSLandingPageProps) {
  return (
    <div className="w-full pb-8 bg-zinc-950 text-zinc-100 select-none font-sans min-h-screen flex flex-col justify-between overflow-x-hidden" id="landing-page-root">
      
      {/* Sleek Minimalist Cinematic Top Navigation Bar */}
      <nav className="h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 flex items-center justify-between px-6 sm:px-12 fixed top-0 left-0 w-full z-50" id="landing-nav">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Clapperboard className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-xs font-bold tracking-widest text-zinc-500 uppercase leading-none">PRE-PRODUCTION</span>
            <span className="font-bold text-base tracking-tight text-white leading-tight">Dundee Studio</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            type="button"
            onClick={onLaunchGuestMode} 
            className="text-xs font-semibold text-zinc-400 hover:text-emerald-400 px-3 py-2 cursor-pointer transition-colors"
            id="landing-nav-demo"
          >
            Open Sandbox Workspace
          </button>
          <button 
            type="button" 
            onClick={onOpenAuth} 
            className="text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg cursor-pointer shadow-md transition-all active:scale-95 duration-200"
            id="landing-btn-login"
          >
            Director Sign In
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-6 sm:px-12 max-w-6xl mx-auto w-full">
        
        {/* Glow Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-2 mb-6"
          id="landing-badge"
        >
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
          <span>CINEMATIC AI STORYBOARD & BLOCKING ENGINE</span>
        </motion.div>

        {/* Hero Copy */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none text-center max-w-5xl font-sans"
          id="landing-main-title"
        >
          From Script to Screenplay.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-600">
            Direct Visuals with AI.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="text-sm sm:text-base text-zinc-400 max-w-2xl mt-6 leading-relaxed text-center font-sans"
          id="landing-description"
        >
          The complete collaborative sandbox for directors, screenplay writers, and directors of photography. 
          Sequence scenes, plan precise camera movements, compile cast and location rosters, 
          and generate high-fidelity pre-visualization boards immediately using advanced Gemini AI logic.
        </motion.p>

        {/* Call to action panel */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full"
          id="landing-actions-container"
        >
          <button 
            type="button"
            onClick={onOpenAuth}
            className="w-full sm:w-auto py-3.5 px-8 bg-white hover:bg-zinc-100 text-black font-extrabold text-sm rounded-xl cursor-pointer active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 font-sans group"
            id="landing-hero-cta"
          >
            Create Director Studio <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            type="button"
            onClick={onLaunchGuestMode}
            className="w-full sm:w-auto py-3.5 px-6 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 font-bold text-sm rounded-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 font-sans"
            id="landing-guest-cta"
          >
            <span>Launch Guest Workspace</span>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>
        </motion.div>

        {/* Production Framework Modules - Features bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-24 text-left" id="landing-bento-grid">
          
          {/* Card 1: Shot List Sequence */}
          <div className="p-6 bg-zinc-900/40 border border-zinc-900 rounded-2xl flex flex-col justify-between hover:border-emerald-500/20 hover:bg-zinc-900/60 transition-all duration-300 group" id="bento-shots">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:bg-emerald-500 group-hover:text-black transition-colors duration-300">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-[9px] font-bold tracking-widest text-emerald-400 uppercase">CAMERA CONTROLS</span>
              <h3 className="font-black text-white text-base mt-1 tracking-tight">Granular Shot Sequences</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Sequence multiple shots with custom angles (close-ups, establishing shots), camera movements (pan, tilt, tracking), lighting environments, and anamorphic lens attributes.
              </p>
            </div>
          </div>

          {/* Card 2: AI Pre-Visualization */}
          <div className="p-6 bg-zinc-900/40 border border-zinc-900 rounded-2xl flex flex-col justify-between hover:border-emerald-500/20 hover:bg-zinc-900/60 transition-all duration-300 group" id="bento-ai">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:bg-purple-500 group-hover:text-black transition-colors duration-300">
              <Sparkles className="w-5 h-5-purple" />
            </div>
            <div>
              <span className="font-mono text-[9px] font-bold tracking-widest text-purple-400 uppercase">GEMINI CREATIVE ENGINE</span>
              <h3 className="font-black text-white text-base mt-1 tracking-tight">AI Script Visualizer</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Convert screenplay lines and production design prompts into rich, detailed frame layouts using state-of-the-art server-side generative intelligence.
              </p>
            </div>
          </div>

          {/* Card 3: Cast & Locations */}
          <div className="p-6 bg-zinc-900/40 border border-zinc-900 rounded-2xl flex flex-col justify-between hover:border-emerald-500/20 hover:bg-zinc-900/60 transition-all duration-300 group" id="bento-scout">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:bg-amber-400 group-hover:text-black transition-colors duration-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-[9px] font-bold tracking-widest text-amber-400 uppercase">CASTING & SCOUTING</span>
              <h3 className="font-black text-white text-base mt-1 tracking-tight">Unified Cast & Stage</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Formulate comprehensive character profiles, equip interactive scene props, store location scouting references, and manage stage coordinates.
              </p>
            </div>
          </div>

          {/* Card 4: Screenplay & Dialogue */}
          <div className="p-6 bg-zinc-900/40 border border-zinc-900 rounded-2xl flex flex-col justify-between hover:border-emerald-500/20 hover:bg-zinc-900/60 transition-all duration-300 group" id="bento-screenplay">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-6 group-hover:bg-teal-500 group-hover:text-black transition-colors duration-300">
              <MessageSquareQuote className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-[9px] font-bold tracking-widest text-teal-400 uppercase">SCREENPLAY TOOLS</span>
              <h3 className="font-black text-white text-base mt-1 tracking-tight">Interactive Script Blocking</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Map characters directly to specific shots, bind live script dialogues, and plan actor movements before steps are walked on stage.
              </p>
            </div>
          </div>

          {/* Card 5: Director's Presentation */}
          <div className="p-6 bg-zinc-900/40 border border-zinc-900 rounded-2xl flex flex-col justify-between hover:border-emerald-500/20 hover:bg-zinc-900/60 transition-all duration-300 group" id="bento-presentation">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:bg-blue-500 group-hover:text-black transition-colors duration-300">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-[9px] font-bold tracking-widest text-blue-400 uppercase">PRESENTATION</span>
              <h3 className="font-black text-white text-base mt-1 tracking-tight">Cinematic Playback Mode</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Transform static frames into an interactive production slideshow presentation complete with overlay cues, notes, and ambient player music.
              </p>
            </div>
          </div>

          {/* Card 6: Sandbox Sandbox */}
          <div className="p-6 bg-zinc-900/40 border border-zinc-900 rounded-2xl flex flex-col justify-between hover:border-emerald-500/20 hover:bg-zinc-900/60 transition-all duration-300 group" id="bento-sandbox">
            <div className="w-10 h-10 rounded-xl bg-zinc-500/10 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-6 group-hover:bg-zinc-100 group-hover:text-black transition-colors duration-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-[9px] font-bold tracking-widest text-zinc-500 uppercase">SANDBOX ISOLATION</span>
              <h3 className="font-black text-white text-base mt-1 tracking-tight">No-Install Instant Editing</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Enter guest mode with a click to craft full storyboard mockups, download offline sequences, or upgrade instantly to sync team files securely.
              </p>
            </div>
          </div>

        </div>

      </main>

      {/* Cinematic Pricing Section */}
      <section className="bg-zinc-950 border-t border-zinc-900 py-20 px-6 sm:px-12 text-center" id="landing-pricing-block">
        <div className="max-w-4xl mx-auto">
          <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 font-bold border border-emerald-500/20 px-3 py-1 rounded-full bg-emerald-500/5">
            PLANS & PRICING
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-4 font-sans">
            Scale From Indie Pitch to Studio Budgets
          </h2>
          <p className="text-xs text-zinc-400 mt-2 max-w-xl mx-auto">
            Access secure offline storyboard capabilities or unlock continuous Gemini rendering, high-capacity databases, and professional team catalogs.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto text-left" id="pricing-grid-container">
            
            {/* Free Indie Plan */}
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-5 flex flex-col justify-between relative hover:border-zinc-800 transition-all duration-200" id="pricing-plan-indie">
              <div>
                <p className="text-[10px] font-bold font-mono text-zinc-500 uppercase">Indie Director</p>
                <p className="text-2xl font-black text-white mt-1">$0 <span className="text-[10px] text-zinc-500 font-normal">/ mo</span></p>
                <div className="h-[1px] bg-zinc-900 my-4" />
                <ul className="space-y-2.5 text-[11px] text-zinc-400">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Instant Guest Sandbox Access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Full Local Camera Sequencing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Custom Cast & Scouting Lists</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={onLaunchGuestMode} 
                className="w-full mt-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-[9px] font-bold text-zinc-300 font-mono tracking-wider cursor-pointer border border-zinc-800 uppercase transition-all duration-200"
              >
                Launch Sandbox
              </button>
            </div>

            {/* Studio Creator Plan */}
            <div className="bg-zinc-900/40 border border-emerald-500/30 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between shadow-lg shadow-emerald-500/5 hover:border-emerald-500/50 transition-all duration-200" id="pricing-plan-creator">
              <span className="absolute top-2 right-2 text-[8px] font-bold bg-emerald-500 text-black px-2 py-0.5 rounded uppercase font-mono tracking-wide">
                RECOMMENDED
              </span>
              <div>
                <p className="text-[10px] font-bold font-mono text-emerald-450 text-emerald-400 uppercase">Showrunner</p>
                <p className="text-2xl font-black text-white mt-1">$29 <span className="text-[10px] text-zinc-500 font-normal">/ mo</span></p>
                <div className="h-[1px] bg-zinc-800/80 my-4" />
                <ul className="space-y-2.5 text-[11px] text-zinc-300 font-sans">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Unlimited Scenes & Storyboards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Auto-Sync Cloud Backups</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Gemini Core Image Generation</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={onOpenAuth} 
                className="w-full mt-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-[9px] font-bold text-black font-mono tracking-wider cursor-pointer transition-all duration-200 uppercase"
              >
                Go Studio Pro
              </button>
            </div>

            {/* Hollywood Elite Plan */}
            <div className="bg-zinc-950 border border-zinc-850 text-white p-5 rounded-xl flex flex-col justify-between hover:border-zinc-800 transition-all duration-200" id="pricing-plan-elite">
              <div>
                <p className="text-[10px] font-bold font-mono text-purple-400 uppercase">Producer Suite</p>
                <p className="text-2xl font-black mt-1">$149 <span className="text-[10px] text-zinc-500 font-normal">/ mo</span></p>
                <div className="h-[1px] bg-zinc-900 my-4" />
                <ul className="space-y-2.5 text-[11px] text-zinc-400">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Enterprise Roles & Script Share</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Priority Ultra-HD Pre-Viz Rendering</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Dedicated Production Pipelines</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={onOpenAuth} 
                className="w-full mt-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[9px] font-bold text-white font-mono tracking-wider cursor-pointer transition-colors uppercase"
              >
                Deploy Hollywood Elite
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Footer copyright */}
      <footer className="py-8 border-t border-zinc-900 bg-zinc-950 text-center px-6 sm:px-12 select-none shrink-0" id="landing-footer">
        <p className="text-[10px] text-zinc-500 font-mono tracking-wider">
          © 2026 DUNDEE STUDIO • CINEMATIC STORYBOARD & FILM PRE-PRODUCTION PLATFORM. ALL DIRECTORS SECURED.
        </p>
      </footer>

    </div>
  );
}
