/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  ChevronLeft, Undo2, Redo2, Layers, MoreVertical, 
  Download, Trash2, Eye, Layout, Grid, HelpCircle
} from 'lucide-react';
import { BACKGROUND_COLORS } from '../constants';
import { CanvasBackground, PaperPattern } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface TopHeaderProps {
  title: string;
  canUndo: boolean;
  canRedo: boolean;
  isLayersOpen: boolean;
  activeBackground: CanvasBackground;
  onRename: (newTitle: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleLayers: () => void;
  onChangeBackground: (bg: Partial<CanvasBackground>) => void;
  onClearCanvas: () => void;
  onExportPNG: () => void;
  onGoBack: () => void;
}

export default function TopHeader({
  title,
  canUndo,
  canRedo,
  isLayersOpen,
  activeBackground,
  onRename,
  onUndo,
  onRedo,
  onToggleLayers,
  onChangeBackground,
  onClearCanvas,
  onExportPNG,
  onGoBack,
}: TopHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [showClearModal, setShowClearModal] = useState(false);

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) {
      onRename(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handlePatternChange = (pattern: PaperPattern) => {
    onChangeBackground({ pattern });
  };

  const handleColorChange = (color: string) => {
    onChangeBackground({ color });
  };

  return (
    <header className="relative w-full h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 select-none z-50 shadow-sm" id="canvas-top-header">
      {/* Left section: Gallery Back and Project Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGoBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-gray-100/80 active:scale-95 text-gray-600 transition-all font-sans text-xs font-semibold border border-gray-100 cursor-pointer"
          title="Back to gallery (Saves automatically)"
          id="btn-back-gallery"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
          <span>Gallery</span>
        </button>

        <div className="h-6 w-[1px] bg-gray-200" />

        {/* Title Editor */}
        <div className="relative group max-w-[12rem] sm:max-w-xs">
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setTempTitle(title);
                  setIsEditingTitle(false);
                }
              }}
              className="font-sans font-semibold text-sm px-2 py-1 border border-indigo-400 bg-white text-gray-800 rounded-lg outline-none focus:ring-1 focus:ring-indigo-400"
              autoFocus
              id="input-edit-project-title"
            />
          ) : (
            <div
              onClick={() => {
                setTempTitle(title);
                setIsEditingTitle(true);
              }}
              className="font-sans font-semibold text-sm px-2 py-1 rounded-lg text-gray-800 hover:bg-gray-50 cursor-pointer flex items-center gap-1.5 transition-colors border border-transparent hover:border-gray-100 truncate"
              title="Click to rename"
              id="txt-project-title-clickable"
            >
              <span className="truncate">{title}</span>
            </div>
          )}
        </div>
      </div>

      {/* Middle section: Undo, Redo */}
      <div className="flex items-center gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2.5 rounded-xl border border-gray-100 text-gray-600 hover:bg-gray-50 disabled:opacity-25 active:scale-95 transition-all text-sm cursor-pointer hover:border-gray-200 shadow-sm"
          title="Undo (Ctrl+Z)"
          id="btn-undo-action"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2.5 rounded-xl border border-gray-100 text-gray-600 hover:bg-gray-50 disabled:opacity-25 active:scale-95 transition-all text-sm cursor-pointer hover:border-gray-200 shadow-sm"
          title="Redo (Ctrl+Y)"
          id="btn-redo-action"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Right section: Layers and Settings */}
      <div className="flex items-center gap-2">
        {/* Toggle Layers Sidebar */}
        <button
          onClick={onToggleLayers}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shadow-sm ${
            isLayersOpen
              ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
              : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'
          }`}
          title="Toggle layers panel"
          id="btn-toggle-layers-sidebar"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* 3-dots canvas custom choices */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-sm ${
              isMenuOpen
                ? 'bg-gray-100 border-gray-300 text-gray-800'
                : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'
            }`}
            id="btn-options-dropdown-trigger"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <>
                {/* Backdrop closer */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                
                {/* Menu popup */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 mt-2 z-50 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 select-none flex flex-col gap-4"
                  id="options-dropdown-flyout"
                >
                  {/* Title / Action items */}
                  <div className="flex flex-col gap-1 border-b border-gray-100 pb-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Actions</p>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onExportPNG();
                      }}
                      className="flex items-center gap-2.5 w-full text-left font-sans text-xs font-semibold text-gray-700 hover:bg-gray-50 p-2 rounded-xl cursor-pointer transition-colors"
                      id="btn-export-dropdown-item"
                    >
                      <Download className="w-4 h-4 text-indigo-500" />
                      <span>Export Drawing (PNG)</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowClearModal(true);
                      }}
                      className="flex items-center gap-2.5 w-full text-left font-sans text-xs font-semibold text-red-600 hover:bg-red-50/50 p-2 rounded-xl cursor-pointer transition-colors"
                      id="btn-clear-dropdown-item"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                      <span>Clear All Layers</span>
                    </button>
                  </div>

                  {/* Canvas Background template block */}
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Canvas Background</p>
                    <div className="flex flex-wrap gap-2 mb-1" id="background-colors-selectors">
                      {BACKGROUND_COLORS.map((bg) => {
                        const isCurrentColor = activeBackground.color === bg.value;
                        return (
                          <button
                            key={bg.name}
                            onClick={() => handleColorChange(bg.value)}
                            className="group relative w-7 h-7 rounded-full border border-gray-200 cursor-pointer shadow-sm active:scale-90 hover:scale-105 transition-all flex items-center justify-center overflow-hidden"
                            style={{ backgroundColor: bg.value }}
                            title={bg.name}
                            id={`bg-color-pick-${bg.name.replace(/\s+/g, '-').toLowerCase()}`}
                          >
                            {isCurrentColor && (
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  bg.isDark ? 'bg-white' : 'bg-gray-800'
                                }`}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Canvas Paper patterns */}
                  <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Paper Pattern</p>
                    <div className="grid grid-cols-2 gap-1.5" id="paper-patterns-selectors">
                      {(['blank', 'ruled-narrow', 'ruled-wide', 'grid'] as PaperPattern[]).map((pattern) => {
                        const isActive = activeBackground.pattern === pattern;
                        return (
                          <button
                            key={pattern}
                            onClick={() => handlePatternChange(pattern)}
                            className={`flex items-center gap-2 py-1.5 px-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                              isActive
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                            id={`bg-pattern-pick-${pattern}`}
                          >
                            <Layout className="w-3.5 h-3.5 opacity-70" />
                            <span className="font-sans text-[11px] font-semibold capitalize">
                              {pattern.replace('ruled-', '')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* MODAL DEFIER - Clear Canvas */}
      <AnimatePresence>
        {showClearModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearModal(false)}
              className="absolute inset-0 bg-black"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 z-50 overflow-hidden border border-gray-100"
              id="clear-canvas-comf-modal"
            >
              <h3 className="font-sans font-bold text-lg text-gray-800 leading-tight mb-2">
                Clear drawing?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-6 font-sans">
                This action is irreversible. All drawn contents across all layers will be erased. Are you sure you want to clear your work?
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 active:scale-95 rounded-xl font-sans text-xs font-semibold text-gray-600 cursor-pointer transition-all"
                  id="btn-modal-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowClearModal(false);
                    onClearCanvas();
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl font-sans text-xs font-semibold shadow-md cursor-pointer transition-all"
                  id="btn-modal-confirm-clear"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
