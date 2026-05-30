import React, { useState, useEffect } from 'react';
import { Shot } from '../../types/dundee';

interface ShotOrderInputProps {
  shot: Shot;
  sceneId: number;
  updateShotOrder: (sceneId: number, shotId: number, newOrderVal: string) => void;
}

export default function ShotOrderInput({ shot, sceneId, updateShotOrder }: ShotOrderInputProps) {
  const [val, setVal] = useState<number | string>(shot.order ?? shot.id);

  useEffect(() => {
    setVal(shot.order ?? shot.id);
  }, [shot.order, shot.id]);

  const handleCommit = () => {
    updateShotOrder(sceneId, shot.id, String(val));
  };

  return (
    <div 
      className="flex items-center gap-1 bg-zinc-950 border border-zinc-800/80 rounded-md overflow-hidden px-1 cursor-text transition-all focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20" 
      title="Edit to rearrange shot order"
    >
      <span className="text-zinc-500 text-[9px] font-bold pl-2 pr-1 tracking-widest">SHOT</span>
      <input
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleCommit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
        className="w-12 bg-transparent text-zinc-200 py-1 text-sm font-bold focus:outline-none text-center"
        step="any"
      />
    </div>
  );
}
