/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Check, Plus, Hash } from 'lucide-react';
import { COLOR_PALETTE } from '../constants';
import { motion } from 'motion/react';

interface ColorPickerPopoverProps {
  activeColor: string;
  onChangeColor: (color: string) => void;
  onClose: () => void;
}

export default function ColorPickerPopover({
  activeColor,
  onChangeColor,
  onClose,
}: ColorPickerPopoverProps) {
  const [customHex, setCustomHex] = useState(activeColor.substring(1));
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    const saved = localStorage.getItem('canvas_recent_colors');
    return saved ? JSON.parse(saved) : ['#ea4335', '#4285f4', '#34a853', '#fbbc05'];
  });

  const handlePresetSelect = (color: string) => {
    onChangeColor(color);
    setCustomHex(color.substring(1));
    addRecentColor(color);
  };

  const addRecentColor = (color: string) => {
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c.toLowerCase() !== color.toLowerCase());
      const updated = [color, ...filtered].slice(0, 8);
      localStorage.setItem('canvas_recent_colors', JSON.stringify(updated));
      return updated;
    });
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9A-Fa-f]/g, '');
    setCustomHex(value);
    if (value.length === 6 || value.length === 3) {
      const decodedColor = `#${value}`;
      onChangeColor(decodedColor);
      addRecentColor(decodedColor);
    }
  };

  const handleNativeColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onChangeColor(value);
    setCustomHex(value.substring(1));
    addRecentColor(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, x: -10 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="absolute left-18 top-48 z-50 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 select-none"
      id="color-picker-flyout"
    >
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-semibold text-gray-800 font-sans tracking-tight">Palette</h4>
        <button
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-md transition-colors"
          id="btn-close-palette"
        >
          Done
        </button>
      </div>

      {/* Preset Colors Grid */}
      <div className="grid grid-cols-5 gap-2 mb-4" id="preset-colors-grid">
        {COLOR_PALETTE.map((color) => {
          const isActive = activeColor.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={color}
              onClick={() => handlePresetSelect(color)}
              className="group relative w-10 h-10 rounded-full border border-gray-200 shadow-sm cursor-pointer hover:scale-108 active:scale-95 transition-all overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: color }}
              title={color}
              id={`preset-color-${color.replace('#', '')}`}
            >
              {isActive && (
                <Check
                  className={`w-5 h-5 ${
                    color.toLowerCase() === '#ffffff' ? 'text-gray-800' : 'text-white drop-shadow-md'
                  }`}
                />
              )}
              <span className="sr-only">{color}</span>
            </button>
          );
        })}

        {/* Advanced Custom Native Color Trigger */}
        <label
          className="group relative w-10 h-10 rounded-full border border-gray-200 shadow-sm cursor-pointer hover:scale-108 active:scale-95 transition-all flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #ff007f 0%, #7f00ff 50%, #00ffff 100%)',
          }}
          title="Custom spectrum picker"
          id="label-native-color-picker"
        >
          <Plus className="w-5 h-5 text-white drop-shadow-md" />
          <input
            type="color"
            value={activeColor}
            onChange={handleNativeColorInput}
            className="sr-only"
            id="input-native-color"
          />
        </label>
      </div>

      {/* Custom hex input */}
      <div className="border-t border-gray-100 pt-3 mb-3">
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
          <Hash className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={customHex}
            onChange={handleHexChange}
            maxLength={6}
            placeholder="000000"
            className="w-full text-sm font-mono text-gray-700 bg-transparent focus:outline-none"
            id="hex-color-input"
          />
          <div
            className="w-5 h-5 rounded-md border border-gray-200 flex-shrink-0"
            style={{ backgroundColor: activeColor }}
          />
        </div>
      </div>

      {/* Recent Colors list */}
      {recentColors.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-medium text-gray-400 mb-2 font-mono">RECENTS</p>
          <div className="flex flex-wrap gap-2" id="recent-colors-row">
            {recentColors.map((color, index) => (
              <button
                key={`${color}-${index}`}
                onClick={() => handlePresetSelect(color)}
                className="w-7 h-7 rounded-full border border-gray-100 shadow-sm hover:scale-110 cursor-pointer active:scale-95 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
                id={`recent-color-${index}`}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
