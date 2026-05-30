import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X, RefreshCw, Loader2, Camera, User, Lightbulb, Box, Crosshair, Navigation, Trash2 } from 'lucide-react';
import { Shot, Character, BlockingElement, BlockingData } from '../../types/dundee';

interface StagingEditorProps {
  sceneId: number;
  shot: Shot;
  characters: Character[];
  updateShotBlocking: (sceneId: number, shotId: number, data: BlockingData) => void;
  onClose: () => void;
  onApplyBlocking: () => void;
  hasRenderedImage: boolean;
  isGenerating: boolean;
}

export default function StagingEditor({
  sceneId,
  shot,
  characters,
  updateShotBlocking,
  onClose,
  onApplyBlocking,
  hasRenderedImage,
  isGenerating
}: StagingEditorProps) {
  const [elements, setElements] = useState<BlockingElement[]>(shot.blockingData?.elements || []);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dragState, setDragState] = useState<{ id: number; offsetX: number; offsetY: number } | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (shot.blockingData?.elements) {
      setElements(shot.blockingData.elements);
    }
  }, [shot.blockingData?.elements]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!dragState || !boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      let newX = ((e.clientX - rect.left) / rect.width) * 100 - dragState.offsetX;
      let newY = ((e.clientY - rect.top) / rect.height) * 100 - dragState.offsetY;
      newX = Math.max(0, Math.min(100, newX));
      newY = Math.max(0, Math.min(100, newY));

      setElements(prev => prev.map(el => el.id === dragState.id ? { ...el, x: newX, y: newY } : el));
    };

    const handleGlobalMouseUp = () => {
      if (dragState) {
        setDragState(null);
        setElements(prev => {
          updateShotBlocking(sceneId, shot.id, { elements: prev });
          return prev;
        });
      }
    };

    if (dragState) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragState, sceneId, shot.id, updateShotBlocking]);

  const handleAdd = (type: 'camera' | 'actor' | 'light' | 'prop') => {
    setElements(prev => {
      const newEl: BlockingElement = {
        id: Date.now(),
        type,
        label: type === 'camera' ? 'CAM A' : type === 'actor' ? 'Actor' : type === 'light' ? 'Key Light' : 'Prop',
        x: 50,
        y: 50,
        rotation: 0,
        color: type === 'camera' ? '#10b981' : type === 'actor' ? '#3b82f6' : type === 'light' ? '#fef08a' : '#a1a1aa',
        height: type === 'camera' ? 1.5 : undefined,
        pitch: type === 'camera' ? 0 : undefined,
        focalLength: type === 'camera' ? 35 : undefined,
        intensity: type === 'light' ? 80 : undefined
      };
      const newElements = [...prev, newEl];
      updateShotBlocking(sceneId, shot.id, { elements: newElements });
      setSelectedId(newEl.id);
      return newElements;
    });
  };

  const updateSelected = (updates: Partial<BlockingElement>) => {
    if (selectedId === null) return;
    setElements(prev => {
      const newElements = prev.map(el => el.id === selectedId ? { ...el, ...updates } as BlockingElement : el);
      updateShotBlocking(sceneId, shot.id, { elements: newElements });
      return newElements;
    });
  };

  const removeSelected = () => {
    if (selectedId === null) return;
    setElements(prev => {
      const newElements = prev.filter(el => el.id !== selectedId);
      updateShotBlocking(sceneId, shot.id, { elements: newElements });
      return newElements;
    });
    setSelectedId(null);
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col mb-8">
      <div className="bg-zinc-900 border-b border-zinc-800 p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-zinc-300 font-bold text-sm uppercase tracking-widest px-2 whitespace-nowrap">
            <MapPin className="w-4 h-4 text-emerald-500" /> Overhead Staging
          </div>
          <div className="hidden md:block h-5 w-px bg-zinc-700"></div>
          <button onClick={() => handleAdd('camera')} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 transition-colors">
            <Camera className="w-3.5 h-3.5 text-emerald-400" /> Camera
          </button>
          <button onClick={() => handleAdd('actor')} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 transition-colors">
            <User className="w-3.5 h-3.5 text-blue-400" /> Actor
          </button>
          <button onClick={() => handleAdd('light')} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 transition-colors">
            <Lightbulb className="w-3.5 h-3.5 text-yellow-400" /> Light
          </button>
          <button onClick={() => handleAdd('prop')} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 transition-colors">
            <Box className="w-3.5 h-3.5 text-zinc-400" /> Prop / Mark
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onApplyBlocking}
            disabled={!hasRenderedImage || isGenerating}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:border-zinc-700 text-white border border-blue-500/50 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-lg"
            title={!hasRenderedImage ? "Render an initial frame first" : "Apply blocking changes directly to the rendered image"}
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Sync to Image
          </button>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row h-auto lg:h-[400px]">
        <div 
          ref={boardRef}
          className="flex-1 min-h-[300px] lg:min-h-0 relative overflow-hidden bg-zinc-900 cursor-crosshair"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
          onMouseDown={() => setSelectedId(null)}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <Crosshair className="w-24 h-24 text-zinc-600" />
          </div>

          {elements.map(el => (
            <div
              key={el.id}
              onMouseDown={(e) => {
                e.stopPropagation();
                setSelectedId(el.id);
                if (boardRef.current) {
                  const rect = boardRef.current.getBoundingClientRect();
                  setDragState({
                    id: el.id,
                    offsetX: ((e.clientX - rect.left) / rect.width) * 100 - el.x,
                    offsetY: ((e.clientY - rect.top) / rect.height) * 100 - el.y
                  });
                }
              }}
              className={`absolute flex items-center justify-center transition-shadow ${selectedId === el.id ? 'ring-2 ring-white rounded-sm scale-110' : ''}`}
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`,
                cursor: dragState?.id === el.id ? 'grabbing' : 'grab',
                zIndex: selectedId === el.id ? 10 : 1,
                width: '40px',
                height: '40px'
              }}
            >
              {el.type === 'camera' && (
                <div className="relative flex flex-col items-center justify-center">
                  <div className="w-8 h-8 bg-zinc-800 border-2 rounded flex items-center justify-center z-10 shadow-lg" style={{ borderColor: el.color }}>
                    <Camera className="w-4 h-4" style={{ color: el.color }} />
                  </div>
                  <div className="absolute top-[100%] w-0 h-0 border-l-[30px] border-r-[30px] border-t-[80px] border-transparent opacity-30 pointer-events-none" style={{ borderTopColor: el.color }}></div>
                </div>
              )}
              {el.type === 'actor' && (
                <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg bg-zinc-800" style={{ borderColor: el.color }}>
                  <span className="text-[10px] font-bold text-white">{el.label.substring(0,2).toUpperCase()}</span>
                </div>
              )}
              {el.type === 'prop' && (
                <div className="w-8 h-8 rounded bg-zinc-800 border-2 border-dashed flex items-center justify-center shadow-lg" style={{ borderColor: el.color }}>
                  <Box className="w-4 h-4" style={{ color: el.color }} />
                </div>
              )}
              {el.type === 'light' && (
                <div className="relative flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 flex items-center justify-center shadow-[0_0_15px_currentColor]" style={{ borderColor: el.color, color: el.color }}>
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div className="absolute top-[100%] w-0 h-0 border-l-[30px] border-r-[30px] border-t-[80px] border-transparent opacity-20 pointer-events-none" style={{ borderTopColor: el.color }}></div>
                </div>
              )}
              
              <div className="absolute -bottom-6 text-[9px] font-bold text-white bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap" style={{ transform: `rotate(${-el.rotation}deg)` }}>
                {el.label}
              </div>
            </div>
          ))}
        </div>

        {selectedElement ? (
          <div className="w-full lg:w-64 bg-zinc-950 border-t lg:border-t-0 lg:border-l border-zinc-800 p-5 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 border-b border-zinc-800/80 pb-3">Edit Properties</h3>
            
            <div>
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Label</label>
              <input 
                type="text" 
                value={selectedElement.label || ''} 
                onChange={(e) => updateSelected({ label: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-white transition-colors"
              />
            </div>

            {selectedElement.type === 'actor' && characters.length > 0 && (
              <div>
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Link Cast Member</label>
                <select 
                  value={selectedElement.label || ''}
                  onChange={(e) => updateSelected({ label: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-white transition-colors"
                >
                  <option value="Actor">Generic Actor</option>
                  {characters.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 flex items-center justify-between">
                Rotation / Heading <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{selectedElement.rotation}°</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="360" 
                value={selectedElement.rotation || 0} 
                onChange={(e) => updateSelected({ rotation: parseInt(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {selectedElement.type === 'camera' && (
              <>
                <div>
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 flex items-center justify-between">
                    Height <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{selectedElement.height || 1.5}m</span>
                  </label>
                  <input type="range" min="0" max="10" step="0.1" value={selectedElement.height || 1.5} onChange={(e) => updateSelected({ height: parseFloat(e.target.value) })} className="w-full accent-emerald-500 cursor-pointer" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 flex items-center justify-between">
                    Pitch <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{selectedElement.pitch || 0}°</span>
                  </label>
                  <input type="range" min="-90" max="90" value={selectedElement.pitch || 0} onChange={(e) => updateSelected({ pitch: parseInt(e.target.value) })} className="w-full accent-emerald-500 cursor-pointer" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 flex items-center justify-between">
                    Focal Length <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{selectedElement.focalLength || 35}mm</span>
                  </label>
                  <input type="range" min="10" max="200" value={selectedElement.focalLength || 35} onChange={(e) => updateSelected({ focalLength: parseInt(e.target.value) })} className="w-full accent-emerald-500 cursor-pointer" />
                </div>
              </>
            )}

            {selectedElement.type === 'light' && (
              <div>
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 flex items-center justify-between">
                  Intensity <span className="text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded">{selectedElement.intensity || 50}%</span>
                </label>
                <input type="range" min="0" max="100" value={selectedElement.intensity || 50} onChange={(e) => updateSelected({ intensity: parseInt(e.target.value) })} className="w-full accent-yellow-500 cursor-pointer" />
              </div>
            )}

            <div>
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Color Marker</label>
              <div className="flex flex-wrap gap-2">
                {['#10b981', '#3b82f6', '#ef4444', '#fef08a', '#f59e0b', '#8b5cf6', '#ec4899', '#a1a1aa'].map(color => (
                  <button 
                    key={color} 
                    onClick={() => updateSelected({ color })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${selectedElement.color === color ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-zinc-800/80">
              <button onClick={removeSelected} className="w-full bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-400 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full lg:w-64 bg-zinc-950 border-t lg:border-t-0 lg:border-l border-zinc-800 p-8 flex flex-col items-center justify-center text-center opacity-40">
            <Navigation className="w-10 h-10 mb-3 text-zinc-500" />
            <span className="text-[10px] uppercase font-bold tracking-widest leading-relaxed">Select an element<br/>to edit properties</span>
          </div>
        )}
      </div>
    </div>
  );
}
