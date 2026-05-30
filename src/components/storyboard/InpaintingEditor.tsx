import React, { useState, useRef, useEffect } from 'react';
import { Paintbrush, Eraser, X, Loader2, Sparkles } from 'lucide-react';

interface InpaintingEditorProps {
  imageUrl: string;
  onClose: () => void;
  onApply: (prompt: string, maskDataUrl: string | null) => void;
  isGenerating: boolean;
}

export default function InpaintingEditor({ imageUrl, onClose, onApply, isGenerating }: InpaintingEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [prompt, setPrompt] = useState('');
  const [brushSize, setBrushSize] = useState(40);
  const [isDrawing, setIsDrawing] = useState(false);

  const initCanvas = () => {
    if (imgRef.current && canvasRef.current) {
      canvasRef.current.width = imgRef.current.width;
      canvasRef.current.height = imgRef.current.height;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      }
    }
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    draw(e, true);
  };

  const draw = (e: any, isFirst = false) => {
    if (!isDrawing && !isFirst) return;
    if (e.cancelable) e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();

    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineWidth = brushSize;

    if (isFirst) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) ctx.closePath();
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleApply = () => {
    if (!prompt.trim()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pixelBuffer = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
    const hasDrawn = pixelBuffer.some(color => color !== 0);

    const maskDataUrl = hasDrawn ? canvas.toDataURL('image/png') : null;
    onApply(prompt, maskDataUrl);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex flex-col font-sans">
      <div className="flex items-center justify-between p-4 bg-zinc-950/80 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg">
            <Paintbrush className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-bold text-zinc-300">Brush Size</span>
            <input
              type="range"
              min="5"
              max="150"
              value={brushSize}
              onChange={e => setBrushSize(parseInt(e.target.value))}
              className="w-24 accent-purple-500"
            />
          </div>
          <button
            onClick={clearCanvas}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-bold transition-colors"
          >
            <Eraser className="w-4 h-4" /> Clear Mask
          </button>
        </div>
        <button
          onClick={onClose}
          disabled={isGenerating}
          className="p-2 bg-zinc-900 hover:bg-red-950/40 hover:text-red-400 text-zinc-400 rounded-lg transition-colors border border-zinc-800 disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-6 overflow-hidden touch-none">
        <div className="relative inline-block max-w-full max-h-full">
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Target"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-none"
            onLoad={initCanvas}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full cursor-crosshair rounded-lg"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20">
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 p-2 rounded-2xl flex items-center gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <input
            type="text"
            placeholder="Describe what to change in the red area..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleApply(); }}
            className="flex-1 bg-transparent text-white px-4 py-2 focus:outline-none placeholder:text-zinc-500 font-medium"
          />
          <button
            onClick={handleApply}
            disabled={isGenerating || !prompt.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white px-5 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 font-bold text-sm tracking-wider uppercase"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isGenerating ? 'Applying...' : 'Apply Edits'}
          </button>
        </div>
      </div>
    </div>
  );
}
