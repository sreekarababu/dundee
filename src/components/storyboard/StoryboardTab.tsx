import React, { useState } from 'react';
import { 
  Clapperboard, Plus, ListChecks, Wand2, Video, Trash2, Camera, MapPin, 
  Sparkles, FileText, Boxes, Activity, RefreshCw, Download, Maximize, Play, 
  Pencil, MessageSquareQuote, ChevronDown, ChevronUp, Image as ImageIcon, Box,
  X, Loader2, Aperture, Users
} from 'lucide-react';

import { Scene, Shot, Character, LocationModel, AccessoryModel, BlockingData } from '../../types/dundee';
import { FRAMING_SHOTS, CAMERA_ANGLES, CAMERA_MOVEMENTS, SPECIALTY_SHOTS, LIGHTING_STYLES, TIME_OF_DAY, CAMERAS } from '../../constants/dundee';
import { handleDownloadSingleImage } from '../../services/imageService';

import ShotOrderInput from './ShotOrderInput';
import StagingEditor from './StagingEditor';

interface StoryboardTabProps {
  parsedScenes: Scene[];
  selectedScene: number | null;
  setSelectedScene: (id: number | null) => void;
  generatedImages: Record<string, string>;
  generatedCollages: Record<number, string[] | string>;
  generatedBreakdowns: Record<string, string>;
  generatedCostumeBoards: Record<number, string>;
  generatedVideos: Record<string, string>;
  characters: Character[];
  locations: LocationModel[];
  accessories: AccessoryModel[];
  selectedStyle: string;
  selectedTone: string;
  selectedPalette: string;
  selectedGlobalTime: string;
  aspectRatio: string;
  generatingIds: Set<string>;
  activeStagingShotId: number | null;
  setActiveStagingShotId: (id: number | null) => void;
  setFullscreenImage: (s: string | null) => void;
  setActiveInpainting: (obj: any) => void;
  imageEditPrompts: Record<string, string>;
  setImageEditPrompts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  
  // Custom action overrides
  addNewScene: () => void;
  addNewShot: (sceneId: number) => void;
  removeShot: (sceneId: number, shotId: number) => void;
  handleRemoveScene: (sceneId: number) => void;
  updateSceneDetails: (sceneId: number, field: keyof Scene, value: any) => void;
  updateShotOrder: (sceneId: number, shotId: number, orderVal: string) => void;
  updateShotBlocking: (sceneId: number, shotId: number, data: BlockingData) => void;
  generateStoryboardShots: (sceneId: number) => void;
  generateMultiCamCoverage: (sceneId: number) => void;
  generatePropsBreakdown: (sceneId: number) => void;
  enhanceShotPrompt: (sceneId: number, shotId: number) => void;
  suggestShotAlternatives: (sceneId: number, shotId: number) => void;
  generateShotMultiCamOptions: (sceneId: number, shotId: number) => void;
  applyMultiCamAsFinal: (sceneId: number, shotId: number, mcOption: any) => void;
  generateLastFrame: (sceneId: number, shotId: number, shotData: Shot) => void;
  generateBlockingMap: (sceneId: number, shotId: number) => void;
  applyBlockingToImage: (sceneId: number, shotId: number) => void;
  generateTechBreakdown: (sceneId: number, shotId: number, shotData: Shot) => void;
  generateCollages: (sceneId: number) => void;
  generateCostumeBoard: (sceneId: number) => void;
  generateAIImage: (sceneId: number, shotId: number, shotData: Shot, mcId?: string | null, isUpdate?: boolean) => void;
  generateVeoVideo: (sceneId: number, shotId: number, options: { prompt: string; startFrameUrl: string | null; endFrameUrl: string | null; duration: string; size: string }) => void;
  editAIImage: (sceneId: number, shotId: number, editPrompt: string, maskDataUrl: string | null) => void;
  handleImportDressCode: (targetId: number, sourceId: number) => void;

  // Shot metadatas adjustments
  updateShotCamera: (sceneId: number, shotId: number, camera: string) => void;
  updateShotLens: (sceneId: number, shotId: number, lens: string) => void;
  updateShotType: (sceneId: number, shotId: number, type: string) => void;
  updateShotAngle: (sceneId: number, shotId: number, angle: string) => void;
  updateShotMovement: (sceneId: number, shotId: number, movement: string) => void;
  updateShotSpecialty: (sceneId: number, shotId: number, specialty: string) => void;
  updateShotDuration: (sceneId: number, shotId: number, dur: string) => void;
  updateShotNotes: (sceneId: number, shotId: number, notes: string) => void;
  updateShotPrompt: (sceneId: number, shotId: number, prompt: string) => void;
  updateShotLighting: (sceneId: number, shotId: number, lighting: string) => void;
  updateShotTimeOfDay: (sceneId: number, shotId: number, time: string) => void;
  updateShotLocation: (sceneId: number, shotId: number, locId: number | null) => void;
}

export default function StoryboardTab({
  parsedScenes,
  selectedScene,
  setSelectedScene,
  generatedImages,
  generatedCollages,
  generatedBreakdowns,
  generatedCostumeBoards,
  generatedVideos,
  characters,
  locations,
  accessories,
  selectedStyle,
  selectedTone,
  selectedPalette,
  selectedGlobalTime,
  aspectRatio,
  generatingIds,
  activeStagingShotId,
  setActiveStagingShotId,
  setFullscreenImage,
  setActiveInpainting,
  imageEditPrompts,
  setImageEditPrompts,

  addNewScene,
  addNewShot,
  removeShot,
  handleRemoveScene,
  updateSceneDetails,
  updateShotOrder,
  updateShotBlocking,
  generateStoryboardShots,
  generateMultiCamCoverage,
  generatePropsBreakdown,
  enhanceShotPrompt,
  suggestShotAlternatives,
  generateShotMultiCamOptions,
  applyMultiCamAsFinal,
  generateLastFrame,
  generateBlockingMap,
  applyBlockingToImage,
  generateTechBreakdown,
  generateCollages,
  generateCostumeBoard,
  generateAIImage,
  generateVeoVideo,
  editAIImage,
  handleImportDressCode,

  updateShotCamera,
  updateShotLens,
  updateShotType,
  updateShotAngle,
  updateShotMovement,
  updateShotSpecialty,
  updateShotDuration,
  updateShotNotes,
  updateShotPrompt,
  updateShotLighting,
  updateShotTimeOfDay,
  updateShotLocation
}: StoryboardTabProps) {
  
  const getAuthHeader = () => { return {}; }; // Dummy stub for reference

  const makeFrameId = (sceneId: number, shotId: number) => `${sceneId}-${shotId}`;
  const makeLastFrameId = (sceneId: number, shotId: number) => `${sceneId}-${shotId}-last`;
  const makeMcFrameId = (sceneId: number, shotId: number, mcId: string) => `${sceneId}-${shotId}-mc-${mcId}`;

  const [veoOptions, setVeoOptions] = useState<Record<string, { duration: string; size: string; useStart: boolean; useEnd: boolean }>>({});


  const getCharactersForShotString = (shot: Shot, chars: Character[]) => {
    if (!shot.characters_present || shot.characters_present.length === 0) return 'None';
    return shot.characters_present.join(', ');
  };

  const handleTextEditLocal = async (sceneId: number, shotId: number, frameId: string) => {
    const prompt = imageEditPrompts[frameId];
    if (!prompt || !prompt.trim()) return;
    await editAIImage(sceneId, shotId, prompt, null);
    setImageEditPrompts(prev => ({ ...prev, [frameId]: '' }));
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Scene Selector */}
      <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-2.5 flex items-center gap-3 overflow-x-auto custom-scrollbar shadow-sm">
        <button onClick={addNewScene} className="shrink-0 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 p-3 rounded-xl transition-colors border border-zinc-700/50 flex items-center justify-center min-w-[48px]" title="Add Manual Scene">
          <Plus className="w-5 h-5" />
        </button>
        <div className="w-px h-8 bg-zinc-800/60 mx-1 shrink-0"></div>
        {parsedScenes.length === 0 ? (
          <div className="text-zinc-500 text-sm px-4 font-bold uppercase tracking-widest flex items-center gap-2">
            <Clapperboard className="w-4 h-4" /> No Sequences Active
          </div>
        ) : (
          parsedScenes.map((scene) => (
            <button key={scene.id} onClick={() => setSelectedScene(scene.id)} className={`shrink-0 px-6 py-3 rounded-xl transition-all whitespace-nowrap text-xs font-bold tracking-wider border ${selectedScene === scene.id ? 'bg-zinc-100 border-white text-zinc-950 shadow-md animate-pulse' : 'bg-zinc-950/50 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}>
              {(scene.title || '').split(' - ')[0] || `Scene ${scene.id}`}
            </button>
          ))
        )}
      </div>

      {/* Active Scene Panel */}
      <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 md:p-8 shadow-sm flex-1 flex flex-col min-h-[800px]">
        {parsedScenes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 py-32">
            <Clapperboard className="w-24 h-24 text-zinc-600 mb-8" />
            <h2 className="text-2xl font-black text-zinc-300 uppercase tracking-widest">Workspace Empty</h2>
            <p className="mt-4 text-base text-zinc-500 font-medium">Extract scenes from a script (in the Setup tab) or add one manually here.</p>
          </div>
        ) : (
          parsedScenes.filter((scene) => scene.id === selectedScene).map((scene) => (
            <div key={scene.id} className="h-full flex flex-col">
              
              {/* Scene Header & Meta */}
              <div className="mb-10 pb-10 flex flex-col lg:flex-row lg:items-start justify-between gap-8 border-b border-zinc-800/60">
                <div className="flex-1 space-y-5">
                  <input 
                    type="text" 
                    value={scene.title || ''} 
                    onChange={(e) => updateSceneDetails(scene.id, 'title', e.target.value)} 
                    className="w-full bg-transparent text-3xl font-black tracking-wide text-zinc-100 focus:outline-none focus:border-b-2 focus:border-emerald-500/50 pb-2 uppercase transition-all" 
                    placeholder="SEQUENCE NAME" 
                  />
                  
                  {locations.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/50 w-max max-w-full">
                      <MapPin className="w-4 h-4 text-emerald-500 ml-1.5" />
                      {(scene.locationIds || []).map((locId, idx) => {
                        const loc = locations.find(l => l.id === locId);
                        if (!loc) return null;
                        return (
                          <div key={`${locId}-${idx}`} className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-1.5 text-[11px] font-bold text-zinc-300 tracking-wider shadow-sm">
                            {loc.name}
                            <button onClick={() => updateSceneDetails(scene.id, 'locationIds', (scene.locationIds || []).filter(id => id !== locId))} className="text-zinc-500 hover:text-red-400">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                      <select 
                        value="" 
                        onChange={(e) => {
                          if (!e.target.value) return;
                          const newId = Number(e.target.value);
                          const currentIds = scene.locationIds || [];
                          if (!currentIds.includes(newId)) {
                            updateSceneDetails(scene.id, 'locationIds', [...currentIds, newId]);
                          }
                        }}
                        className="bg-zinc-700 border border-dashed border-zinc-500 hover:border-zinc-400 rounded-lg px-4 py-1.5 text-[11px] font-bold text-white focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="">+ Assign Location</option>
                        {locations.filter(l => !(scene.locationIds || []).includes(l.id)).map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                          <FileText className="w-4 h-4" /> Scene Script & Description
                        </span>
                        <select
                          value=""
                          onChange={(e) => {
                            if(e.target.value) handleImportDressCode(scene.id, parseInt(e.target.value));
                          }}
                          className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-[10px] font-bold text-zinc-400 focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                        >
                          <option value="">Import Dress Code...</option>
                          {parsedScenes.filter(s => s.id !== scene.id && s.description?.match(/\[SCENE DRESS CODE:[\s\S]*?\]/i)).map(s => (
                            <option key={s.id} value={s.id}>From: {(s.title || '').split(' - ')[0] || `Scene ${s.id}`}</option>
                          ))}
                        </select>
                      </div>
                      <div className="relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-zinc-800 rounded-l-xl group-focus-within:bg-emerald-500/50 transition-colors"></div>
                        <textarea 
                          value={scene.description || ''} 
                          onChange={(e) => updateSceneDetails(scene.id, 'description', e.target.value)} 
                          className="w-full bg-zinc-950/80 text-zinc-400 text-sm font-mono leading-relaxed resize-y focus:outline-none rounded-xl pl-6 p-5 min-h-[140px] border border-zinc-800/80 focus:border-emerald-500/30 transition-all custom-scrollbar shadow-inner" 
                          placeholder="Sequence action/dialogue data..." 
                        />
                      </div>
                    </div>
                    
                    {/* Asset Breakdown Panel */}
                    <div className="flex flex-col gap-4 bg-zinc-950/80 p-5 rounded-2xl border border-blue-900/30 shadow-inner">
                      <div className="flex items-center gap-2 mb-1">
                        <Boxes className="w-4 h-4 text-blue-400" />
                        <span className="text-[11px] uppercase tracking-widest font-bold text-blue-500/80">Asset Breakdown (Props, VFX, SFX)</span>
                      </div>
                      {scene.propsBreakdown ? (
                        <div className="text-[12px] text-blue-300/80 font-mono space-y-2 overflow-y-auto max-h-[100px] custom-scrollbar">
                          {scene.propsBreakdown.props && scene.propsBreakdown.props.length > 0 && <p><strong className="text-blue-400">Props:</strong> {scene.propsBreakdown.props.join(', ')}</p>}
                          {scene.propsBreakdown.vfx && scene.propsBreakdown.vfx.length > 0 && <p><strong className="text-blue-400">VFX:</strong> {scene.propsBreakdown.vfx.join(', ')}</p>}
                          {scene.propsBreakdown.sfx && scene.propsBreakdown.sfx.length > 0 && <p><strong className="text-blue-400">SFX:</strong> {scene.propsBreakdown.sfx.join(', ')}</p>}
                          {scene.propsBreakdown.wardrobe && scene.propsBreakdown.wardrobe.length > 0 && <p><strong className="text-blue-400">Wardrobe:</strong> {scene.propsBreakdown.wardrobe.join(', ')}</p>}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[90px] text-[11px] text-blue-500/40 font-mono italic">
                          Click 'Extract Elements' to generate breakdown...
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3 pt-4 border-t border-blue-900/20 mt-auto">
                        <button 
                          onClick={() => generatePropsBreakdown(scene.id)} 
                          disabled={generatingIds.has(`props-${scene.id}`)}
                          className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 border border-blue-500/30 disabled:opacity-50"
                        >
                          {generatingIds.has(`props-${scene.id}`) ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListChecks className="w-4 h-4" />}
                          Extract Elements
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 gap-3 flex-wrap w-full lg:w-auto justify-start lg:justify-end items-start mt-2">
                  <button onClick={() => generateStoryboardShots(scene.id)} className="bg-zinc-100 hover:bg-white text-zinc-950 px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md">
                    <Wand2 className="w-5 h-5" /> Auto-Plan Shots
                  </button>
                  <button onClick={() => generateMultiCamCoverage(scene.id)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md">
                    <Video className="w-5 h-5" /> Multi-Cam Coverage
                  </button>
                  <button onClick={() => addNewShot(scene.id)} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-zinc-100 px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" /> Add Frame
                  </button>
                  <button onClick={() => handleRemoveScene(scene.id)} className="bg-transparent hover:bg-red-950/40 border border-transparent hover:border-red-900/50 text-zinc-500 hover:text-red-400 px-5 py-4 rounded-xl transition-all flex items-center justify-center" title="Delete Sequence">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Shots List details */}
              <div className="space-y-10 overflow-y-auto custom-scrollbar pb-10 pr-2">
                {scene.shots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-zinc-950/50 rounded-3xl border-2 border-dashed border-zinc-800">
                    <div className="bg-zinc-900 p-5 rounded-full mb-6">
                      <Aperture className="w-12 h-12 text-emerald-500/50" />
                    </div>
                    <h3 className="text-lg font-black text-zinc-300 uppercase tracking-widest mb-4">No Frames Planned</h3>
                    <p className="text-base text-zinc-500 mb-8 max-w-lg leading-relaxed">The AI needs to read the script above to plan the perfect cinematic shots, or you can add them manually.</p>
                  </div>
                ) : (
                  [...(scene.shots || [])].sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id)).map((shot, idx) => {
                    const frameId = makeFrameId(scene.id, shot.id);
                    const isGenerating = generatingIds.has(frameId);
                    const hasImage = !!generatedImages[frameId];
                    const safePrompt = shot.prompt || '';
                    
                    return (
                      <div key={`${shot.id}-${idx}`} className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 md:p-8 group relative shadow-lg hover:border-zinc-700/80 transition-colors">
                        {/* Shot Header metadata */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8 pb-5 border-b border-zinc-800/60">
                          <div className="flex flex-wrap items-center gap-4">
                            <ShotOrderInput shot={shot} sceneId={scene.id} updateShotOrder={updateShotOrder} />
                            <div className="h-5 w-px bg-zinc-700/50"></div>
                            <span className="text-emerald-400 text-xs font-mono font-bold tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">{shot.duration}</span>
                            {shot.category && (
                              <span className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 uppercase tracking-widest bg-zinc-800">
                                {shot.category}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => setActiveStagingShotId(activeStagingShotId === shot.id ? null : shot.id)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors border shadow-sm ${activeStagingShotId === shot.id ? 'bg-emerald-500 text-zinc-950 border-emerald-400' : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200'}`}
                            >
                              <MapPin className="w-4 h-4" /> Blocking Map
                            </button>
                            {activeStagingShotId === shot.id && (
                              <button 
                                onClick={() => generateBlockingMap(scene.id, shot.id)}
                                disabled={generatingIds.has(`blocking-${scene.id}-${shot.id}`)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors border bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30 disabled:opacity-50 shadow-sm"
                              >
                                {generatingIds.has(`blocking-${scene.id}-${shot.id}`) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Auto-Gen Map
                              </button>
                            )}
                            <button onClick={() => removeShot(scene.id, shot.id)} className="text-zinc-600 hover:text-red-400 transition-colors p-2.5 rounded-xl hover:bg-red-950/30">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Staging Map Insertion */}
                        {activeStagingShotId === shot.id && (
                          <StagingEditor 
                            sceneId={scene.id} 
                            shot={shot} 
                            characters={characters} 
                            updateShotBlocking={updateShotBlocking} 
                            onClose={() => setActiveStagingShotId(null)} 
                            onApplyBlocking={() => applyBlockingToImage(scene.id, shot.id)}
                            hasRenderedImage={hasImage}
                            isGenerating={isGenerating}
                          />
                        )}
                        
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                          {/* LEFT COLUMN: Metadata inputs */}
                          <div className="lg:col-span-5 flex flex-col gap-6">
                            <div className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800/80 space-y-5">
                              <div className="flex items-center gap-2 mb-2">
                                <Camera className="w-5 h-5 text-zinc-500" />
                                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Optical Setup</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                                <div className="flex flex-col gap-2">
                                  <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold">Framing</span>
                                  <select value={shot.type || 'Medium Shot (MS)'} onChange={(e) => updateShotType(scene.id, shot.id, e.target.value)} className="bg-zinc-700 border border-zinc-600 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 transition-all font-semibold">
                                    {FRAMING_SHOTS.map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold">Angle</span>
                                  <select value={shot.cameraAngle || 'Eye-Level Shot'} onChange={(e) => updateShotAngle(scene.id, shot.id, e.target.value)} className="bg-zinc-700 border border-zinc-600 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 transition-all font-semibold">
                                    {CAMERA_ANGLES.map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold">Motion</span>
                                  <select value={shot.cameraMovement || 'Static / None'} onChange={(e) => updateShotMovement(scene.id, shot.id, e.target.value)} className="bg-zinc-700 border border-zinc-600 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 transition-all font-semibold">
                                    {CAMERA_MOVEMENTS.map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold">Lens Data</span>
                                  <select value={shot.lens || ''} onChange={(e) => updateShotLens(scene.id, shot.id, e.target.value)} className="bg-zinc-700 border border-zinc-600 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 transition-all font-semibold">
                                    <option value="">Auto Lens</option>
                                    <option value="50mm Prime">50mm Prime</option>
                                    <option value="35mm Prime">35mm Prime</option>
                                    <option value="24mm Prime">24mm Prime</option>
                                    <option value="85mm Prime">85mm Prime</option>
                                  </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold">Duration (sec)</span>
                                  <input type="text" value={shot.duration || ''} onChange={(e) => updateShotDuration(scene.id, shot.id, e.target.value)} className="bg-zinc-700 border border-zinc-600 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none text-center font-bold" />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold">Director Notes</span>
                                  <input type="text" value={shot.notes || ''} onChange={(e) => updateShotNotes(scene.id, shot.id, e.target.value)} placeholder="Opt note" className="bg-zinc-700 border border-zinc-600 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none" />
                                </div>
                              </div>
                              <div className="flex items-center gap-4 mt-3">
                                <select value={shot.camera || ''} onChange={(e) => updateShotCamera(scene.id, shot.id, e.target.value)} className="bg-zinc-700 border border-zinc-600 text-xs font-semibold text-white rounded-xl px-4 py-3 focus:outline-none w-full">
                                  <option value="">Auto Camera</option>
                                  {CAMERAS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select value={shot.locationId || ''} onChange={(e) => updateShotLocation(scene.id, shot.id, e.target.value ? parseInt(e.target.value) : null)} className="bg-zinc-700 border border-zinc-600 text-xs font-semibold text-white rounded-xl px-4 py-3 focus:outline-none w-full">
                                  <option value="">Setting Location</option>
                                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                                </select>
                              </div>
                            </div>

                            <div className="flex flex-col gap-4 flex-1">
                              {shot.script_snippet && (
                                <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl border-l-4 border-l-emerald-500">
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                                    <FileText className="w-4 h-4" /> Source dialogue
                                  </span>
                                  <p className="font-serif italic text-[13px] text-zinc-300">"{shot.script_snippet}"</p>
                                </div>
                              )}
                              <div className="flex-1 flex flex-col relative group">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Visual Generation Prompt</span>
                                  <button onClick={() => enhanceShotPrompt(scene.id, shot.id)} disabled={generatingIds.has(`enhance-${shot.id}`)} className="text-[9px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded px-2.5 py-1 flex items-center gap-1">
                                    <Wand2 className="w-3 h-3" /> Enhance
                                  </button>
                                </div>
                                <textarea 
                                  value={safePrompt} 
                                  onChange={(e) => updateShotPrompt(scene.id, shot.id, e.target.value)} 
                                  className="flex-1 w-full min-h-[140px] bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-[13px] text-zinc-300 focus:outline-none focus:border-emerald-500/50 resize-none font-mono leading-relaxed"
                                />
                              </div>
                            </div>
                          </div>

                          {/* RIGHT COLUMN: Output Canvas */}
                          <div className="lg:col-span-7 flex flex-col gap-5">
                            <div className="flex flex-col sm:flex-row items-center justify-between bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80 gap-4 shadow">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="bg-zinc-700 text-[11px] font-bold text-white px-2.5 py-1.5 rounded-lg border border-zinc-600">
                                  {shot.lighting || 'Cinematic'}
                                </span>
                                <span className="bg-zinc-700 text-[11px] font-bold text-white px-2.5 py-1.5 rounded-lg border border-zinc-600">
                                  {shot.timeOfDay || 'Day'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                {hasImage && (
                                  <button onClick={() => generateAIImage(scene.id, shot.id, shot, null, true)} disabled={isGenerating} className="bg-blue-650 hover:bg-blue-550 border border-blue-600/30 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-md">
                                    <RefreshCw className="w-4 h-4" /> Sync
                                  </button>
                                )}
                                <button onClick={() => generateAIImage(scene.id, shot.id, shot, null, false)} disabled={isGenerating} className="bg-zinc-100 text-zinc-950 hover:bg-white disabled:opacity-50 text-xs font-black px-5 py-2.5 rounded-xl uppercase tracking-widest flex items-center gap-2 shadow duration-150">
                                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} Render
                                </button>
                              </div>
                            </div>

                            {/* Image Frame Wrapper */}
                            <div className="rounded-2xl border-2 border-zinc-800/80 bg-zinc-950 overflow-hidden relative flex items-center justify-center mx-auto shadow-2xl w-full" style={{ aspectRatio: aspectRatio.replace(':', '/'), maxHeight: '600px' }}>
                              {isGenerating && (
                                <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md flex flex-col items-center justify-center z-10 text-emerald-400 font-bold uppercase text-xs tracking-widest">
                                  <Loader2 className="w-12 h-12 text-emerald-400 mb-4 animate-spin" /> Synthesizing Canvas Pixels
                                </div>
                              )}
                              {hasImage ? (
                                <span className="w-full h-full flex items-center justify-center group/img">
                                  <img src={generatedImages[frameId]} alt={`Frame ${shot.id}`} className="w-full h-full object-cover"/>
                                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-3 backdrop-blur-sm duration-150">
                                    <button onClick={() => generateAIImage(scene.id, shot.id, shot)} className="bg-zinc-800 text-zinc-200 p-3 rounded-xl hover:bg-zinc-700 shadow-xl" title="Reroll"><RefreshCw className="w-5 h-5" /></button>
                                    <button onClick={() => handleDownloadSingleImage(generatedImages[frameId], `board_s${scene.id}_${shot.id}.png`)} className="bg-emerald-500/20 text-emerald-400 p-3 rounded-xl hover:bg-emerald-500/30 shadow-xl" title="Download"><Download className="w-5 h-5" /></button>
                                    <button onClick={() => setFullscreenImage(generatedImages[frameId])} className="bg-blue-500/20 text-blue-400 p-3 rounded-xl hover:bg-blue-500/30 shadow-xl" title="Maximize"><Maximize className="w-5 h-5" /></button>
                                  </div>
                                </span>
                              ) : (
                                <div className="flex flex-col items-center p-8 opacity-20">
                                  <ImageIcon className="w-12 h-12 mb-3 text-zinc-500" />
                                  <span className="text-xs uppercase font-bold tracking-widest">Frame Empty</span>
                                </div>
                              )}
                            </div>

                            {/* Post Processing Tools */}
                            {hasImage && (
                              <div className="flex flex-col gap-4 mt-3">
                                {/* Last Frame Generation */}
                                <div className="w-full bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80 shadow-sm flex flex-col gap-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                      <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5"><Video className="w-4 h-4 text-blue-400" /> Motion / End Frame</span>
                                      <span className="text-[10px] text-zinc-500 mt-0.5">Generate the final frame based on camera & artist movement</span>
                                    </div>
                                    <button 
                                      onClick={() => generateLastFrame(scene.id, shot.id, shot)} 
                                      disabled={generatingIds.has(makeLastFrameId(scene.id, shot.id))} 
                                      className="bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-50 text-blue-400 px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 border border-blue-500/30 transition-colors"
                                    >
                                      {generatingIds.has(makeLastFrameId(scene.id, shot.id)) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Gen Last Frame
                                    </button>
                                  </div>
                                  
                                  {generatedImages[makeLastFrameId(scene.id, shot.id)] && (
                                    <div className="rounded-xl border border-zinc-800 bg-black overflow-hidden relative group/lastframe w-full mt-2" style={{ aspectRatio: aspectRatio.replace(':', '/') }}>
                                      <img src={generatedImages[makeLastFrameId(scene.id, shot.id)]} className="w-full h-full object-cover" alt="Last frame" />
                                      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-[10px] font-black text-white px-2 py-1 rounded tracking-widest border border-zinc-700">END FRAME</div>
                                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/lastframe:opacity-100 transition-all flex items-center justify-center gap-4 backdrop-blur-sm">
                                        <button onClick={() => handleDownloadSingleImage(generatedImages[makeLastFrameId(scene.id, shot.id)], `last_frame_s${scene.id}_${shot.id}.png`)} className="bg-emerald-500/20 text-emerald-400 p-3 rounded-xl hover:bg-emerald-500/30" title="Download"><Download className="w-5 h-5" /></button>
                                        <button onClick={() => setFullscreenImage(generatedImages[makeLastFrameId(scene.id, shot.id)])} className="bg-blue-500/20 text-blue-400 p-3 rounded-xl hover:bg-blue-500/30" title="View Fullscreen"><Maximize className="w-5 h-5" /></button>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Veo Video Generation Panel */}
                                <div className="w-full bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80 shadow-sm flex flex-col gap-3">
                                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                                    <div className="flex items-center gap-2">
                                      <Video className="w-4 h-4 text-emerald-400" />
                                      <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Veo 3 Video Synthesis</span>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <label className="flex items-center gap-2 text-[11px] text-zinc-400 cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={veoOptions[frameId]?.useStart ?? true} 
                                        onChange={(e) => setVeoOptions(prev => ({ ...prev, [frameId]: { ...(prev[frameId] || { duration: '5s', size: '16:9' }), useStart: e.target.checked } }))} 
                                        className="accent-emerald-500 rounded bg-zinc-800 border-zinc-700" 
                                      />
                                      Use Primary Frame as Start
                                    </label>
                                    <label className="flex items-center gap-2 text-[11px] text-zinc-400 cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={veoOptions[frameId]?.useEnd ?? false} 
                                        onChange={(e) => setVeoOptions(prev => ({ ...prev, [frameId]: { ...(prev[frameId] || { duration: '5s', size: '16:9', useStart: true }), useEnd: e.target.checked } }))} 
                                        className="accent-emerald-500 rounded bg-zinc-800 border-zinc-700" 
                                      />
                                      Use End Frame (if available)
                                    </label>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <select 
                                      value={veoOptions[frameId]?.duration ?? '5s'} 
                                      onChange={(e) => setVeoOptions(prev => ({ ...prev, [frameId]: { ...(prev[frameId] || { size: '16:9', useStart: true, useEnd: false }), duration: e.target.value } }))} 
                                      className="bg-zinc-950 border border-zinc-800 text-xs text-white rounded-xl px-3 py-2"
                                    >
                                      <option value="5s">5 Seconds</option>
                                      <option value="10s">10 Seconds</option>
                                    </select>
                                    <select 
                                      value={veoOptions[frameId]?.size ?? '16:9'} 
                                      onChange={(e) => setVeoOptions(prev => ({ ...prev, [frameId]: { ...(prev[frameId] || { duration: '5s', useStart: true, useEnd: false }), size: e.target.value } }))} 
                                      className="bg-zinc-950 border border-zinc-800 text-xs text-white rounded-xl px-3 py-2"
                                    >
                                      <option value="16:9">16:9 Widescreen</option>
                                      <option value="9:16">9:16 Vertical</option>
                                      <option value="1:1">1:1 Square</option>
                                    </select>
                                    <button 
                                      onClick={() => generateVeoVideo(scene.id, shot.id, {
                                        prompt: shot.prompt,
                                        startFrameUrl: (veoOptions[frameId]?.useStart ?? true) ? generatedImages[frameId] : null,
                                        endFrameUrl: (veoOptions[frameId]?.useEnd ?? false) ? generatedImages[makeLastFrameId(scene.id, shot.id)] : null,
                                        duration: veoOptions[frameId]?.duration ?? '5s',
                                        size: veoOptions[frameId]?.size ?? '16:9'
                                      })}
                                      disabled={generatingIds.has(`veo-${frameId}`)}
                                      className="ml-auto bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 disabled:opacity-50 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
                                    >
                                      {generatingIds.has(`veo-${frameId}`) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Synthesize Video
                                    </button>
                                  </div>

                                  {generatedVideos[frameId] && (
                                    <div className="mt-3 rounded-xl border-2 border-emerald-900 overflow-hidden relative w-full bg-black">
                                      <video 
                                        src={generatedVideos[frameId]} 
                                        controls 
                                        autoPlay 
                                        loop 
                                        className="w-full object-cover"
                                        style={{ aspectRatio: (veoOptions[frameId]?.size ?? '16:9').replace(':', '/') }}
                                      />
                                      <div className="absolute top-2 left-2 bg-emerald-500/20 text-emerald-400 backdrop-blur-md px-2 py-1 rounded border border-emerald-500/30 text-[10px] font-bold tracking-widest">
                                        VEO 3 GENERATED
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col md:flex-row gap-4">
                                  {/* Inpainting and Mask Editors */}
                                  <div className="flex-1 bg-zinc-900/60 p-4 rounded-xl border border-zinc-850 flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                      <Pencil className="w-4 h-4 text-purple-400" />
                                      <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Inpainting Tools</span>
                                    </div>
                                    <button 
                                      onClick={() => setActiveInpainting({ sceneId: scene.id, shotId: shot.id, frameId, imageUrl: generatedImages[frameId] })}
                                      className="bg-purple-650 hover:bg-purple-550 border border-purple-500/20 text-white py-2 rounded-lg text-xs font-bold transition-all shadow"
                                    >
                                      Edit / Inpaint Canvas Area
                                    </button>
                                    <div className="w-full flex gap-2">
                                      <input
                                        type="text"
                                        placeholder="Quick edit descriptor..."
                                        value={imageEditPrompts[frameId] || ''}
                                        onChange={(e) => setImageEditPrompts(prev => ({ ...prev, [frameId]: e.target.value }))}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleTextEditLocal(scene.id, shot.id, frameId); }}
                                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300"
                                      />
                                      <button
                                        onClick={() => handleTextEditLocal(scene.id, shot.id, frameId)}
                                        disabled={!imageEditPrompts[frameId]?.trim() || isGenerating}
                                        className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 px-3 rounded-xl"
                                      >
                                        <Wand2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* AI Director Alternatives */}
                                  <div className="flex-1 bg-zinc-900/60 p-4 rounded-xl border border-zinc-850 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block"><MessageSquareQuote className="w-4 h-4" /> director suggestions</span>
                                      <button onClick={() => suggestShotAlternatives(scene.id, shot.id)} disabled={generatingIds.has(`alts-${frameId}`)} className="text-[9px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded px-2 py-1 flex items-center gap-1">
                                        <Wand2 className="w-3 h-3" /> suggest
                                      </button>
                                    </div>
                                    {shot.aiIdeas ? (
                                      <p className="text-[11px] font-mono whitespace-pre-wrap text-amber-400/80 pr-1 overflow-y-auto max-h-[100px] leading-relaxed">{shot.aiIdeas}</p>
                                    ) : (
                                      <p className="text-[11px] text-zinc-650 italic mt-3 text-center">Click suggest for framing ideas</p>
                                    )}
                                  </div>
                                </div>

                                {/* Cinematography Telemetry specs */}
                                <div className="w-full bg-zinc-900/80 p-5 rounded-2xl border border-emerald-950 flex flex-col gap-3 shadow-inner">
                                  <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                                    <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                      <Activity className="w-4 h-4" /> Telemetry & Technical Analysis
                                    </span>
                                    <button 
                                      onClick={() => generateTechBreakdown(scene.id, shot.id, shot)}
                                      disabled={generatingIds.has(`breakdown-${frameId}`)}
                                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest"
                                    >
                                      {generatingIds.has(`breakdown-${frameId}`) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />} Gen Specs
                                    </button>
                                  </div>
                                  
                                  {generatedBreakdowns[frameId] ? (
                                    <div className="rounded-xl border border-emerald-500/35 bg-black overflow-hidden relative group/dash shadow">
                                      <img src={generatedBreakdowns[frameId]} className="w-full h-auto max-h-[600px] object-contain" alt="Specs Board" />
                                      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/dash:opacity-100 flex items-center justify-center gap-3 backdrop-blur-md">
                                        <button onClick={() => handleDownloadSingleImage(generatedBreakdowns[frameId], `tech_specs_${shot.id}.png`)} className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5"><Download className="w-4 h-4" /> Download</button>
                                        <button onClick={() => setFullscreenImage(generatedBreakdowns[frameId])} className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5"><Maximize className="w-4 h-4" /> View</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-[10px] uppercase font-black tracking-wider text-zinc-650 text-center py-6">Pending technical specifications</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Multi Cam coverage sub-selection */}
                        <div className="mt-8 pt-8 border-t border-zinc-800/60">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                              <Video className="w-5 h-5 text-blue-500" /> Simultaneous Coverage Options
                            </span>
                            <button
                              onClick={() => generateShotMultiCamOptions(scene.id, shot.id)}
                              disabled={generatingIds.has(`multicam-gen-${scene.id}-${shot.id}`)}
                              className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 px-4.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                            >
                              {generatingIds.has(`multicam-gen-${scene.id}-${shot.id}`) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                              Gen Multi-Cam Angles
                            </button>
                          </div>

                          {shot.multiCamOptions && shot.multiCamOptions.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
                              {shot.multiCamOptions.map((mc, idx) => {
                                const mcFrameId = makeMcFrameId(scene.id, shot.id, mc.id);
                                const isMcGen = generatingIds.has(mcFrameId);
                                const hasMcImg = !!generatedImages[mcFrameId];

                                return (
                                  <div key={`${mc.id || idx}-${idx}`} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 flex flex-col gap-3 shadow-inner">
                                    <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                                      <span className="text-xs font-black text-zinc-300 truncate">{mc.camLabel}</span>
                                      <button onClick={() => applyMultiCamAsFinal(scene.id, shot.id, mc)} className="bg-emerald-500 bg-opacity-15 text-emerald-400 hover:bg-emerald-500/25 px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider">Apply</button>
                                    </div>
                                    <div className="text-[10px] text-zinc-500 font-mono tracking-tight leading-normal">
                                      <p className="truncate font-semibold">{mc.type}</p>
                                      <p className="truncate text-blue-400/80">{mc.lens}</p>
                                    </div>
                                    <div className="rounded-xl bg-black relative aspect-video flex items-center justify-center overflow-hidden border border-zinc-800 mt-2">
                                      {isMcGen && <Loader2 className="w-6 h-6 text-emerald-400 animate-spin absolute z-10" />}
                                      {hasMcImg ? (
                                        <img src={generatedImages[mcFrameId]} className="w-full h-full object-cover" />
                                      ) : (
                                        !isMcGen && <Video className="w-6 h-6 text-zinc-800" />
                                      )}
                                    </div>
                                    <button 
                                      onClick={() => generateAIImage(scene.id, shot.id, { ...shot, type: mc.type, lens: mc.lens, prompt: mc.prompt }, mc.id)} 
                                      disabled={isMcGen || isGenerating}
                                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase py-2.5 rounded-xl border border-zinc-700 mt-2"
                                    >
                                      {hasMcImg ? 'Reroll Angle' : 'Render Angle'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Costume turnaround boards & Grid compiles */}
              {scene.shots.length > 0 && (
                <div className="mt-12 pt-10 border-t border-[#1f1f1f] space-y-12">
                  
                  {/* Costume Board */}
                  <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-400" />
                        <span className="text-xs font-black text-zinc-300 uppercase tracking-widest">Character Wardrobe Turnaround Chart</span>
                      </div>
                      <button 
                        onClick={() => generateCostumeBoard(scene.id)} 
                        disabled={generatingIds.has(`costume-board-${scene.id}`)}
                        className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider"
                      >
                        {generatingIds.has(`costume-board-${scene.id}`) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />} Gen Wardrobe Specs
                      </button>
                    </div>

                    {generatedCostumeBoards[scene.id] ? (
                      <div className="rounded-xl border border-purple-500/20 bg-black overflow-hidden relative group/cost">
                        <img src={generatedCostumeBoards[scene.id]} alt="Wardrobe turnaround specs" className="w-full h-auto object-cover" />
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/cost:opacity-100 flex items-center justify-center gap-3 backdrop-blur-sm transition-opacity duration-200">
                          <button onClick={() => handleDownloadSingleImage(generatedCostumeBoards[scene.id], `wardrobe_s${scene.id}.png`)} className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-5 py-3 rounded-lg text-sm font-bold uppercase flex items-center gap-2 shadow-xl"><Download className="w-5 h-5" /> Download specs</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-zinc-650 uppercase font-bold tracking-widest text-center py-6">Pending Wardrobe Turnaround specs</p>
                    )}
                  </div>

                  {/* Collage Grids */}
                  <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-emerald-400" />
                        <span className="text-xs font-black text-zinc-300 uppercase tracking-widest">compiled storyboards collage</span>
                      </div>
                      <button 
                        onClick={() => generateCollages(scene.id)} 
                        disabled={generatingIds.has(`collages-${scene.id}`)}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider"
                      >
                        {generatingIds.has(`collages-${scene.id}`) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />} Compile Storyboard Grid
                      </button>
                    </div>

                    {generatedCollages[scene.id] ? (
                      <div className="rounded-xl border border-emerald-500/20 bg-black overflow-hidden relative group/col">
                        <img src={Array.isArray(generatedCollages[scene.id]) ? (generatedCollages[scene.id] as string[])[0] : (generatedCollages[scene.id] as string)} alt="Storyboard Grid" className="w-full h-auto object-cover" />
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/col:opacity-100 flex items-center justify-center gap-3 backdrop-blur-sm transition-opacity duration-200">
                          <button onClick={() => handleDownloadSingleImage(Array.isArray(generatedCollages[scene.id]) ? (generatedCollages[scene.id] as string[])[0] : (generatedCollages[scene.id] as string), `storyboard_grid_s${scene.id}.png`)} className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-5 py-3 rounded-lg text-sm font-bold uppercase flex items-center gap-2 shadow-xl"><Download className="w-5 h-5" /> Download Collage</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-zinc-650 uppercase font-bold tracking-widest text-center py-6">Pending Storyboard Grid Compile</p>
                    )}
                  </div>

                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
export {};
