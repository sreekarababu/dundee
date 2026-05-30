/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface SizeOpacitySliderProps {
  mode: 'size' | 'opacity';
  value: number; // For size (1-100) or opacity (0-1)
  activeColor: string;
  onChange: (value: number) => void;
  onClose: () => void;
}

export default function SizeOpacitySliders({
  mode,
  value,
  activeColor,
  onChange,
  onClose,
}: SizeOpacitySliderProps) {
  const isSize = mode === 'size';
  
  // Handlers
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChange(val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, x: -10 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`absolute left-18 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 select-none flex flex-col items-center ${
        isSize ? 'top-64 w-44' : 'top-80 w-44'
      }`}
      id={`slider-flyout-${mode}`}
    >
      <div className="w-full flex justify-between items-center mb-3">
        <span className="text-xs font-semibold text-gray-500 font-sans tracking-tight uppercase">
          {isSize ? 'Size' : 'Opacity'}
        </span>
        <span className="text-xs font-mono text-gray-700 font-semibold bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
          {isSize ? `${Math.round(value)}px` : `${Math.round(value * 100)}%`}
        </span>
      </div>

      {/* Input Range Slider */}
      <div className="w-full h-12 flex items-center justify-center relative">
        <input
          type="range"
          min={isSize ? 1 : 0.05}
          max={isSize ? 100 : 1}
          step={isSize ? 1 : 0.01}
          value={value}
          onChange={handleSliderChange}
          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-300"
          id={`range-input-${mode}`}
        />
      </div>

      {/* Real-time Brush Circle Preview */}
      {isSize ? (
        <div className="w-18 h-18 mt-2 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100 relative">
          <div
            className="rounded-full shadow-inner transition-all duration-75"
            style={{
              width: `${Math.max(2, Math.min(64, value))}px`,
              height: `${Math.max(2, Math.min(64, value))}px`,
              backgroundColor: activeColor,
            }}
          />
        </div>
      ) : (
        <div className="w-24 h-6 mt-2 relative rounded overflow-hidden border border-gray-200 [background-image:linear-gradient(45deg,#ccc_25%,transparent_25%),linear-gradient(-45deg,#ccc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ccc_75%),linear-gradient(-45deg,transparent_75%,#ccc_75%)] [background-size:8px_8px] [background-position:0_0,0_4px,4px_-4px,-4px_0]">
          <div
            className="w-full h-full transition-all duration-75"
            style={{
              backgroundColor: activeColor,
              opacity: value,
            }}
          />
        </div>
      )}

      {/* Close trigger */}
      <button
        onClick={onClose}
        className="w-full mt-4 text-xs text-indigo-600 bg-indigo-50 py-1.5 rounded-lg font-medium hover:bg-indigo-100 transition-colors cursor-pointer text-center"
        id={`btn-close-slider-${mode}`}
      >
        Done
      </button>
    </motion.div>
  );
}
