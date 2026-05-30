/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { 
  Pencil, Pen, Highlighter, Brush, Eraser, 
  ChevronLeft, Sliders, Settings, Sparkles, Send, RotateCw, AlertTriangle, HelpCircle
} from 'lucide-react';
import { 
  BrushType, BrushSettings, LayerState, CanvasBackground, 
  DrawingProject, PaperPattern
} from '../types';
import { BRUSH_PRESETS } from '../constants';
import ColorPickerPopover from './ColorPickerPopover';
import SizeOpacitySliders from './SizeOpacitySliders';
import { motion, AnimatePresence } from 'motion/react';
import { saasApi } from '../lib/authSupport';
import APIHealthMonitor from './APIHealthMonitor';

interface CanvasWorkspaceProps {
  project: DrawingProject;
  activeLayerId: string;
  onUpdateProject: (updater: Partial<DrawingProject> | ((p: DrawingProject) => DrawingProject)) => void;
  onSelectLayer: (id: string) => void;
  onUpdateLayerThumbnails: (thumbnails: Record<string, string>) => void;
  canUndo: boolean;
  canRedo: boolean;
  onPushHistory: (layerId: string, beforeSnapshot: string, afterSnapshot: string) => void;
  onUndoTriggerRef: React.MutableRefObject<(() => void) | null>;
  onRedoTriggerRef: React.MutableRefObject<(() => void) | null>;
  onClearCanvasTriggerRef: React.MutableRefObject<(() => void) | null>;
  onExportPNGTriggerRef: React.MutableRefObject<((title: string) => void) | null>;
  user?: any;
  onRefreshUser?: () => void;
}

export default function CanvasWorkspace({
  project,
  activeLayerId,
  onUpdateProject,
  onSelectLayer,
  onUpdateLayerThumbnails,
  canUndo,
  canRedo,
  onPushHistory,
  onUndoTriggerRef,
  onRedoTriggerRef,
  onClearCanvasTriggerRef,
  onExportPNGTriggerRef,
  user,
  onRefreshUser,
}: CanvasWorkspaceProps) {
  // Brush states
  const [activeBrush, setActiveBrush] = useState<BrushType>('pen');
  const [brushSettings, setBrushSettings] = useState<Record<BrushType, BrushSettings>>(() => {
    // Clone presets so users can customize them independently
    return JSON.parse(JSON.stringify(BRUSH_PRESETS));
  });

  // AI Copilot states
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Helper to execute vector points returned from Gemini design helper
  const drawAIPoints = (points: { x: number; y: number }[]) => {
    const canvas = canvasRefs.current[activeLayerId];
    if (!canvas || points.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Capture snapshot for UNDO history
    const beforeSnap = canvas.toDataURL('image/png');

    ctx.save();
    const settings = brushSettings[activeBrush];
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = settings.color || '#4f46e5';
    ctx.lineWidth = Math.max(3, settings.size);
    ctx.globalAlpha = settings.opacity || 1.0;

    // Apply scaling relative to template coordinate box [0-500]
    const scaleX = canvas.width / 500;
    const scaleY = canvas.height / 500;

    ctx.beginPath();
    ctx.moveTo(points[0].x * scaleX, points[0].y * scaleY);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x * scaleX, points[i].y * scaleY);
    }
    
    ctx.stroke();
    ctx.restore();

    const afterSnap = canvas.toDataURL('image/png');
    onPushHistory(activeLayerId, beforeSnap, afterSnap);
    triggerThumbnailsUpdate();
  };

  const handleTriggerAICopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    if (!user) {
      setAiError('You must sign in to connect with the Gemini AI Copilot.');
      return;
    }
    if (user.tokens_remaining < 25) {
      setAiError('Insufficient Paint Tokens quota. Purchase a Premium tier to continue.');
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiMessage(null);

    try {
      const response = await saasApi.askAiCopilot(aiPrompt);
      if (response && response.points && response.points.length > 0) {
        drawAIPoints(response.points);
        setAiMessage(response.explanation || 'Vector design element successfully injected onto canvas!');
        setAiPrompt('');
        if (onRefreshUser) onRefreshUser();
      } else {
        setAiError(response.error || 'Gemini could not generate a vector path matching that prompt. Try a simpler geometry description.');
      }
    } catch (err: any) {
      setAiError(err.message || 'AI request timed out or was suspended by rate limiters.');
    } finally {
      setAiLoading(false);
    }
  };

  // UI state overlays
  const [activePopover, setActivePopover] = useState<'color' | 'size' | 'opacity' | null>(null);

  // References to the canvases
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  // Drawing tracking references
  const isDrawingRef = useRef(false);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const strokeLayerBeforeSnapshotRef = useRef<string>(''); // DataURL before current stroke
  const isLayerLoadingRef = useRef<Record<string, boolean>>({});

  // Undo / Redo histories direct hooks across the active layer
  const activeLayerSettings = brushSettings[activeBrush];

  // Helper: Retrieve active layer object
  const activeLayer = project.layers.find((l) => l.id === activeLayerId) || project.layers[0];

  // Restores backing canvases from drawing project layers
  useEffect(() => {
    project.layers.forEach((layer) => {
      const canvas = canvasRefs.current[layer.id];
      if (!canvas || !layer.canvasData) return;
      
      // Prevent resetting canvases continuously
      if (isLayerLoadingRef.current[layer.id]) return;
      isLayerLoadingRef.current[layer.id] = true;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.referrerPolicy = "no-referrer";
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        isLayerLoadingRef.current[layer.id] = false;
        triggerThumbnailsUpdate();
      };
      img.src = layer.canvasData;
    });
  }, [project.id]); // trigger only when changing project entirely

  // Handle window and container resizes while preserving canvas data
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        handleResize(width, height);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [project.layers.map(l => l.id).join(',')]); // re-bind when layer list structure changes

  const handleResize = (newWidth: number, newHeight: number) => {
    if (newWidth <= 0 || newHeight <= 0) return;

    // Loop through each active layer canvas node
    project.layers.forEach((layer) => {
      const canvas = canvasRefs.current[layer.id];
      if (!canvas) return;

      // If dimensions are identical, skip
      if (canvas.width === Math.floor(newWidth) && canvas.height === Math.floor(newHeight)) {
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw standard scaling backups
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // Backup
        tempCtx.drawImage(canvas, 0, 0);
        
        // Resize actual canvas
        canvas.width = Math.floor(newWidth);
        canvas.height = Math.floor(newHeight);
        
        // Restore contents centered or from top-left
        ctx.drawImage(tempCanvas, 0, 0);
      } else {
        canvas.width = Math.floor(newWidth);
        canvas.height = Math.floor(newHeight);
      }
    });

    // Populate initial default drawings if they had canvasData strings
    project.layers.forEach((layer) => {
      const canvas = canvasRefs.current[layer.id];
      if (!canvas || !layer.canvasData) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.referrerPolicy = "no-referrer";
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = layer.canvasData;
    });

    triggerThumbnailsUpdate();
  };

  // Build the live project thumbnails for the Right Layers Panel
  const triggerThumbnailsUpdate = () => {
    const thumbs: Record<string, string> = {};
    project.layers.forEach((layer) => {
      const canvas = canvasRefs.current[layer.id];
      if (canvas) {
        thumbs[layer.id] = canvas.toDataURL('image/png');
      }
    });
    onUpdateLayerThumbnails(thumbs);
    
    // Save state to outer layer object for sync saving
    onUpdateProject((prev) => {
      const updatedLayers = prev.layers.map((l) => ({
        ...l,
        canvasData: thumbs[l.id] || l.canvasData,
      }));
      
      // Consolidation high-level thumbnail
      const backingMerged = document.createElement('canvas');
      const firstCanvas = Object.values(canvasRefs.current)[0] as HTMLCanvasElement | null | undefined;
      if (firstCanvas) {
        backingMerged.width = firstCanvas.width;
        backingMerged.height = firstCanvas.height;
        const bCtx = backingMerged.getContext('2d');
        if (bCtx) {
          // Flatten layers bottom up
          prev.layers.forEach((lay) => {
            if (!lay.visible) return;
            const layCanv = canvasRefs.current[lay.id];
            if (layCanv) {
              bCtx.save();
              bCtx.globalAlpha = lay.opacity;
              bCtx.drawImage(layCanv, 0, 0);
              bCtx.restore();
            }
          });
        }
      }

      return {
        ...prev,
        thumbnail: backingMerged.toDataURL('image/png'),
        layers: updatedLayers,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Implement external actions sent by Header commands
  useEffect(() => {
    // UNDO triggered by Header
    onUndoTriggerRef.current = () => {
      // App-level undo logic resides in the main app, but we need to restore drawing
      // We will perform actual restore in App component which triggers state update
    };

    // CLEAR all layers
    onClearCanvasTriggerRef.current = () => {
      project.layers.forEach((layer) => {
        const canvas = canvasRefs.current[layer.id];
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      });
      triggerThumbnailsUpdate();
    };

    // EXPORT canvas as merged drawing PNG
    onExportPNGTriggerRef.current = (titleName: string) => {
      const firstCanvas = Object.values(canvasRefs.current)[0] as HTMLCanvasElement | null | undefined;
      if (!firstCanvas) return;

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = firstCanvas.width;
      exportCanvas.height = firstCanvas.height;
      const exportCtx = exportCanvas.getContext('2d');
      if (!exportCtx) return;

      // 1. Draw Paper background color
      exportCtx.fillStyle = project.background.color;
      exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // 2. Draw Paper grid patterns if needed
      drawBackgroundPatternToCtx(exportCtx, exportCanvas.width, exportCanvas.height, project.background);

      // 3. Flatten drawing layers bottom up
      project.layers.forEach((layer) => {
        if (!layer.visible) return;
        const c = canvasRefs.current[layer.id];
        if (c) {
          exportCtx.save();
          exportCtx.globalAlpha = layer.opacity;
          exportCtx.drawImage(c, 0, 0);
          exportCtx.restore();
        }
      });

      // 4. Trigger browser download anchor
      const url = exportCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${titleName.toLowerCase().replace(/\s+/g, '_')}_drawing.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    return () => {
      onUndoTriggerRef.current = null;
      onClearCanvasTriggerRef.current = null;
      onExportPNGTriggerRef.current = null;
    };
  }, [project, project.background, project.layers]);

  // Method to draw grid/ruled paper patterns to contexts (such as on exporting)
  const drawBackgroundPatternToCtx = (
    ctx: CanvasRenderingContext2D | any, 
    w: number, 
    h: number, 
    bg: CanvasBackground
  ) => {
    if (bg.pattern === 'blank') return;

    ctx.save();
    const isDarkBg = bg.color === '#202124' || bg.color === '#1b4d3e';
    ctx.strokeStyle = isDarkBg ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;

    if (bg.pattern === 'grid') {
      const gSize = 32;
      ctx.beginPath();
      for (let x = 0; x < w; x += gSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += gSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
    } else {
      const spacing = bg.pattern === 'ruled-narrow' ? 24 : 36;
      ctx.beginPath();
      // Side margin rule like real notebook paper
      if (!isDarkBg) {
        ctx.strokeStyle = 'rgba(234, 67, 53, 0.25)'; // Pinkish margin line
        ctx.lineWidth = 1.5;
        ctx.moveTo(100, 0);
        ctx.lineTo(100, h);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.05)';
        ctx.lineWidth = 1;
      }

      ctx.beginPath();
      for (let y = spacing; y < h; y += spacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  // Restore individual layer data values if loaded via parent undo trigger
  const restoreCanvasData = (layerId: string, dataUrl: string) => {
    const canvas = canvasRefs.current[layerId];
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!dataUrl) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      triggerThumbnailsUpdate();
      return;
    }

    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      triggerThumbnailsUpdate();
    };
    img.src = dataUrl;
  };

  // Expose local restoration handle to window/global scoped triggers for seamless coordinate restore
  useEffect(() => {
    (window as any).restoreCanvasLayerData = restoreCanvasData;
    return () => {
      delete (window as any).restoreCanvasLayerData;
    };
  }, [project.layers]);


  // GET coord from Pointer event relative to canvas bounding box
  const getCoordinates = (e: React.PointerEvent<HTMLDivElement>) => {
    const canvas = canvasRefs.current[activeLayerId];
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Drawing Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const canvas = canvasRefs.current[activeLayerId];
    if (!canvas || !activeLayer.visible) return; // ignore if layer hidden

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Capture starting state for History (Undo/Redo)
    strokeLayerBeforeSnapshotRef.current = canvas.toDataURL('image/png');

    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    
    const coord = getCoordinates(e);
    pointsRef.current = [coord];
    
    // Draw initial dot (for single taps)
    drawActiveSampleSegment(ctx, coord, coord, coord, true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawingRef.current) return;

    const canvas = canvasRefs.current[activeLayerId];
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coord = getCoordinates(e);
    const points = pointsRef.current;
    
    points.push(coord);

    if (points.length < 3) return;

    // Smooth spline curves using quadratic bezier curves
    const prev = points[points.length - 2];
    const curr = points[points.length - 1];
    const mid = {
      x: (prev.x + curr.x) / 2,
      y: (prev.y + curr.y) / 2,
    };

    drawActiveSampleSegment(ctx, prev, curr, mid, false);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawingRef.current) return;
    
    const canvas = canvasRefs.current[activeLayerId];
    if (!canvas) return;

    canvas.releasePointerCapture(e.pointerId);
    isDrawingRef.current = false;

    // Save final stroke onto history tree
    const strokeLayerAfterSnapshot = canvas.toDataURL('image/png');
    onPushHistory(
      activeLayerId,
      strokeLayerBeforeSnapshotRef.current,
      strokeLayerAfterSnapshot
    );

    pointsRef.current = [];
    triggerThumbnailsUpdate();
  };

  // Unified Line Drawing Engine
  const drawActiveSampleSegment = (
    ctx: CanvasRenderingContext2D,
    prev: { x: number; y: number },
    curr: { x: number; y: number },
    mid: { x: number; y: number },
    isDot: boolean = false
  ) => {
    ctx.save();
    
    const settings = activeLayerSettings;
    ctx.lineCap = activeBrush === 'marker' ? 'square' : 'round';
    ctx.lineJoin = activeBrush === 'marker' ? 'miter' : 'round';
    ctx.strokeStyle = settings.color;
    ctx.lineWidth = settings.size;

    // Setup Composite operation (for erasers)
    if (activeBrush === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1.0;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = settings.opacity;
    }

    if (isDot) {
      // Draw small solid dot for immediate mouse down tap
      ctx.beginPath();
      ctx.arc(curr.x, curr.y, Math.max(1, settings.size / 2), 0, Math.PI * 2);
      if (activeBrush === 'eraser') {
        ctx.fill();
      } else {
        ctx.fillStyle = settings.color;
        ctx.globalAlpha = settings.opacity;
        ctx.fill();
      }
    } else {
      if (activeBrush === 'pencil') {
        // Soft lead graphite look
        ctx.globalAlpha = settings.opacity * 0.7;
        ctx.lineWidth = Math.max(1.2, settings.size * 0.5);
        ctx.shadowBlur = 0.6;
        ctx.shadowColor = settings.color;
        
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y);
        ctx.stroke();
      } else if (activeBrush === 'chalk') {
        // Textured grainy chalk
        ctx.lineWidth = settings.size;
        ctx.shadowBlur = 1.0;
        ctx.shadowColor = settings.color;
        
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y);
        ctx.stroke();

        // granular chalk dust scatter along path vector
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const granularSteps = Math.floor(dist / 3);

        for (let i = 0; i < granularSteps; i++) {
          const ratio = i / granularSteps;
          const sx = prev.x + dx * ratio;
          const sy = prev.y + dy * ratio;

          for (let p = 0; p < 3; p++) {
            const angle = Math.random() * Math.PI * 2;
            const distRadius = Math.random() * (settings.size * 0.55);
            const dustX = sx + Math.cos(angle) * distRadius;
            const dustY = sy + Math.sin(angle) * distRadius;

            ctx.fillStyle = settings.color;
            ctx.globalAlpha = (Math.random() * 0.3) * settings.opacity;
            ctx.beginPath();
            ctx.arc(dustX, dustY, Math.random() * 1.5 + 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else {
        // Solid Pen, Highlighter/Marker, or Eraser stroke
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y);
        ctx.stroke();
      }
    }

    ctx.restore();
  };

  // Change individual active settings
  const handleBrushSettingChange = (value: number) => {
    setBrushSettings((prev) => {
      const activeSetting = prev[activeBrush];
      const updated = {
        ...activeSetting,
        [activePopover === 'size' ? 'size' : 'opacity']: value,
      };
      return {
        ...prev,
        [activeBrush]: updated,
      };
    });
  };

  const handleActiveColorChange = (color: string) => {
    setBrushSettings((prev) => {
      const activeSetting = prev[activeBrush];
      const updated = {
        ...activeSetting,
        color,
      };
      
      // Update color for all brushes *except* eraser
      const draft = { ...prev };
      (Object.keys(draft) as BrushType[]).forEach((b) => {
        if (b !== 'eraser') {
          draft[b] = {
            ...draft[b],
            color,
          };
        }
      });
      return draft;
    });
  };

  const getPatternStyles = (bg: CanvasBackground): React.CSSProperties => {
    if (bg.pattern === 'blank') return {};
    
    const isDarkBg = bg.color === '#202124' || bg.color === '#1b4d3e';
    const gridLineColor = isDarkBg ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    const marginLineColor = 'rgba(239, 68, 68, 0.2)'; // Coral Margin

    if (bg.pattern === 'grid') {
      return {
        backgroundImage: `linear-gradient(to right, ${gridLineColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridLineColor} 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      };
    }

    const lineSpacing = bg.pattern === 'ruled-narrow' ? '24px' : '36px';
    const marginStyle = isDarkBg 
      ? `linear-gradient(to bottom, transparent calc(${lineSpacing} - 1px), ${gridLineColor} calc(${lineSpacing} - 1px))`
      : `linear-gradient(to bottom, transparent calc(${lineSpacing} - 1px), ${gridLineColor} calc(${lineSpacing} - 1px)), linear-gradient(to right, transparent 99px, ${marginLineColor} 99px, ${marginLineColor} 101px, transparent 101px)`;
    
    return {
      backgroundImage: marginStyle,
      backgroundSize: `100% ${lineSpacing}, 100% 100%`,
    };
  };

  const bgStyles = getPatternStyles(project.background);

  return (
    <div className="flex-1 relative flex overflow-hidden select-none" id="drawing-workspace-container">
      <APIHealthMonitor componentName="Drawing Workspace" onDismiss={() => {}} />
      
      {/* LEFT SIDEBAR: Brush Palette Dock */}
      <div 
        className="w-16 bg-white border-r border-gray-100 flex flex-col items-center py-4 justify-between select-none z-30 shadow-md"
        id="brushes-side-navigation"
      >
        <div className="flex flex-col items-center gap-5 w-full">
          {/* Active Preset Brush Brads */}
          <div className="flex flex-col gap-2.5 w-full items-center">
            {(['pencil', 'pen', 'marker', 'chalk', 'eraser'] as BrushType[]).map((brush) => {
              const isActive = activeBrush === brush;
              const settings = brushSettings[brush];

              return (
                <button
                  key={brush}
                  onClick={() => {
                    setActiveBrush(brush);
                    setActivePopover(null);
                  }}
                  className={`group relative w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-102'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                  title={`${brush.charAt(0).toUpperCase() + brush.slice(1)} (size: ${Math.round(settings.size)}px)`}
                  id={`btn-brush-select-${brush}`}
                >
                  {brush === 'pencil' && <Pencil className="w-5 h-5 stroke-1.8" />}
                  {brush === 'pen' && <Pen className="w-5 h-5 stroke-1.8" />}
                  {brush === 'marker' && <Highlighter className="w-5 h-5 stroke-1.8" />}
                  {brush === 'chalk' && <Brush className="w-5 h-5 stroke-1.8" />}
                  {brush === 'eraser' && <Eraser className="w-5 h-5 stroke-1.8" />}

                  {/* Active Border Accent */}
                  {isActive && (
                    <motion.div
                      layoutId="activeBrushGlow"
                      className="absolute inset-0 rounded-full border border-indigo-500 -m-1"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="w-8 h-[1px] bg-gray-100" />

          {/* Sizing/Swatch floating controllers */}
          <div className="flex flex-col gap-3.5 w-full items-center">
            {/* Color Ball */}
            {activeBrush !== 'eraser' && (
              <button
                onClick={() =>
                  setActivePopover(activePopover === 'color' ? null : 'color')
                }
                className={`w-9 h-9 rounded-full border border-gray-200 shadow-sm transition-all focus:outline-none cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center relative ${
                  activePopover === 'color' ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                }`}
                style={{ backgroundColor: activeLayerSettings.color }}
                title="Brush color palette"
                id="btn-color-picker"
              >
                <div className="w-3 h-3 rounded-full bg-white/40 border border-white/25 pointer-events-none" />
              </button>
            )}

            {/* Brush Size indicator icon */}
            <button
              onClick={() =>
                setActivePopover(activePopover === 'size' ? null : 'size')
              }
              className={`w-9 h-9 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${
                activePopover === 'size'
                  ? 'border-indigo-300 bg-indigo-50/50 text-indigo-600'
                  : 'border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
              title="Stroke size settings"
              id="btn-size-settings"
            >
              <div
                className="rounded-full bg-current transition-all duration-75"
                style={{
                  width: `${Math.max(3, Math.min(18, activeLayerSettings.size * 0.3 + 2))}px`,
                  height: `${Math.max(3, Math.min(18, activeLayerSettings.size * 0.3 + 2))}px`,
                }}
              />
            </button>

            {/* Opacity indicator text block */}
            <button
              onClick={() =>
                setActivePopover(activePopover === 'opacity' ? null : 'opacity')
              }
              className={`w-9 h-9 rounded-xl border flex flex-col items-center justify-center cursor-pointer font-mono font-bold text-[10px] text-center transition-all ${
                activePopover === 'opacity'
                  ? 'border-indigo-300 bg-indigo-50/50 text-indigo-650 text-indigo-600'
                  : 'border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
              title="Brush opacity settings"
              id="btn-opacity-settings"
            >
              <span>{Math.round(activeLayerSettings.opacity * 100)}</span>
              <span className="text-[7px] text-gray-400 font-sans tracking-tight">OPAC</span>
            </button>

            {/* AI COPILOT BUTTON */}
            <button
              onClick={() => setIsAiOpen(!isAiOpen)}
              className={`w-9 h-9 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${
                isAiOpen
                  ? 'border-purple-300 bg-purple-50 text-purple-650 text-purple-600 shadow-sm'
                  : 'border-gray-200 text-gray-500 hover:text-purple-650 hover:text-purple-600 hover:bg-purple-50/50'
              }`}
              title="Ask Gemini AI Drawing Copilot"
              id="btn-ai-copilot-trigger"
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="text-[7px] font-sans font-bold uppercase tracking-tight">AI COPILOT</span>
            </button>
          </div>
        </div>

        {/* Small floating branding/info */}
        <div className="text-[9px] font-bold text-gray-405 text-gray-300 font-mono tracking-wider rotate-180 writing-mode-vertical">
          CANVASCLOUD
        </div>
      </div>

      {/* Floating Flyouts overlays */}
      <AnimatePresence>
        {activePopover === 'color' && (
          <ColorPickerPopover
            activeColor={activeLayerSettings.color}
            onChangeColor={handleActiveColorChange}
            onClose={() => setActivePopover(null)}
          />
        )}
        {(activePopover === 'size' || activePopover === 'opacity') && (
          <SizeOpacitySliders
            mode={activePopover}
            value={activePopover === 'size' ? activeLayerSettings.size : activeLayerSettings.opacity}
            activeColor={activeLayerSettings.color}
            onChange={handleBrushSettingChange}
            onClose={() => setActivePopover(null)}
          />
        )}
      </AnimatePresence>

      {/* CANVAS DRAWING WORKSPACE (Center main screen) */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 h-full select-none overflow-hidden relative cursor-crosshair [touch-action:none]"
        style={{
          backgroundColor: project.background.color,
          ...bgStyles,
        }}
        id="canvas-active-drawing-workspace"
      >
        {/* Absolute dynamic stack of canvases per drawing layer */}
        {project.layers.map((layer) => (
          <canvas
            key={layer.id}
            ref={(el) => {
              canvasRefs.current[layer.id] = el;
            }}
            style={{
              display: layer.visible ? 'block' : 'none',
              opacity: layer.opacity,
              zIndex: project.layers.findIndex((l) => l.id === layer.id) + 10,
            }}
            className="absolute inset-0 w-full h-full pointer-events-none"
            id={`layer-canvas-element-${layer.id}`}
          />
        ))}

        {/* Informative Overlay - Hidden/Opacity Warning */}
        {!activeLayer.visible && (
          <div className="absolute top-4 left-4 z-40 bg-red-600/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-lg text-xs font-semibold animate-bounce">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>Active Layer is hidden. Make it visible in the Layers panel to see your drawing.</span>
          </div>
        )}
      </div>

      {/* SLIDING AI ASSISTANT PANEL */}
      <AnimatePresence>
        {isAiOpen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 bg-white border-l border-gray-200 h-full flex flex-col z-40 relative select-none"
            id="ai-copilot-sliding-drawer"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-150 flex items-center justify-between bg-purple-50/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                <span className="font-bold text-xs text-purple-950 uppercase tracking-wider font-sans">Gemini AI Copilot</span>
              </div>
              <button 
                onClick={() => setIsAiOpen(false)}
                className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            {/* Quota balance overview */}
            {user && (
              <div className="p-4 bg-slate-50 border-b border-gray-150 text-[11px] font-sans">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] text-gray-455 text-gray-450 font-mono font-bold uppercase tracking-wider">Balance Quota</span>
                  <span className="text-purple-700 bg-purple-50 border border-purple-100 font-mono font-bold px-1.5 py-0.2 rounded text-[9px]">
                    {user.package_type} TIER
                  </span>
                </div>
                <p className="font-black text-slate-800 text-sm">
                  {user.tokens_remaining.toLocaleString()} <span className="text-[11px] text-gray-455 text-gray-450 font-semibold font-sans">Paint Tokens Remaining</span>
                </p>
                <p className="text-[10px] text-gray-400 mt-1 font-medium">Copilot design queries deduct 25 tokens per path generation.</p>
              </div>
            )}

            {/* Input Prompt and Helper preset suggestions */}
            <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto space-y-4">
              <form onSubmit={handleTriggerAICopilot} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-450 uppercase tracking-widest mb-1.5 font-sans">Create Object Prompt</label>
                  <textarea
                    rows={4}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Draw a custom five-pointed star outline"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-250 border-gray-200 focus:bg-white focus:outline-none rounded-xl font-medium outline-indigo-500 font-sans resize-none text-gray-800 shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="w-full py-2.5 bg-indigo-650 bg-indigo-600/95 hover:bg-indigo-700 text-white font-sans text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiLoading ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin text-purple-200" />
                      <span>Co-sketching design vector...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Execute Design (Uses 25 tokens)</span>
                    </>
                  )}
                </button>
              </form>

              {/* Error triggers */}
              {aiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-[11px] font-medium leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Output text */}
              {aiMessage && (
                <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-xl text-[11px] text-emerald-800 font-sans leading-relaxed">
                  <p className="font-bold mb-1 col-span-2">🤖 Copilot Action completed:</p>
                  <p className="text-[10px] text-emerald-700 leading-relaxed font-semibold">{aiMessage}</p>
                </div>
              )}

              {/* Sample Presets */}
              <div className="pt-2">
                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono">Drawing Sample Presets</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Crescent Moon', prompt: 'Draw a crescent moon vector path' },
                    { label: 'Geometric Star', prompt: 'Draw a pristine 5-pointed concentric star' },
                    { label: 'Triangle Sail', prompt: 'Draw a simple geometric sailboat structure outline' },
                    { label: 'Paper Snowflake', prompt: 'Draw a dynamic geometric snowflake trace line' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAiPrompt(preset.prompt)}
                      className="text-left p-2 border border-gray-100 hover:border-purple-300 hover:bg-purple-50/20 rounded-lg text-[10px] text-gray-600 transition-colors cursor-pointer block"
                    >
                      <p className="font-bold text-gray-800">{preset.label}</p>
                      <p className="text-[8px] text-gray-400 truncate mt-0.5">{preset.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom branding panel */}
            <div className="p-3 bg-slate-50 border-t border-gray-150 text-center text-[10px] text-gray-405 text-gray-400 font-mono mt-auto flex items-center justify-center gap-1.5 select-none">
              <span>gemini-3.5-flash priority</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
