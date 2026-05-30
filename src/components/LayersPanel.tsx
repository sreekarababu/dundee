/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Layers, Plus, Trash2, Eye, EyeOff, 
  ChevronUp, ChevronDown, Edit2, Check, X, SlidersHorizontal
} from 'lucide-react';
import { LayerState } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface LayersPanelProps {
  layers: LayerState[];
  activeLayerId: string;
  layerThumbnails: Record<string, string>; // mapping layerId -> base64 png
  onSelectLayer: (id: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  onRenameLayer: (id: string, newName: string) => void;
  onClose: () => void;
}

export default function LayersPanel({
  layers,
  activeLayerId,
  layerThumbnails,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
  onToggleVisibility,
  onChangeOpacity,
  onMoveLayer,
  onRenameLayer,
  onClose,
}: LayersPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showOpacitySliderId, setShowOpacitySliderId] = useState<string | null>(null);

  const startRename = (layer: LayerState) => {
    setEditingId(layer.id);
    setRenameValue(layer.name);
  };

  const handleRenameSave = (id: string) => {
    if (renameValue.trim()) {
      onRenameLayer(id, renameValue.trim());
    }
    setEditingId(null);
  };

  // Render from top down (last items in layers array are topmost visually)
  const reversedLayers = [...layers].reverse();

  return (
    <motion.div
      initial={{ opacity: 0, x: 280 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 280 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="absolute right-0 top-16 z-40 w-72 h-[calc(100vh-4rem)] bg-white border-l border-gray-100 shadow-xl flex flex-col select-none"
      id="layers-sidebar-panel"
    >
      {/* Title Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2 text-gray-800 font-medium">
          <Layers className="w-5 h-5 text-indigo-500" />
          <span className="font-sans font-semibold text-sm">Layers</span>
          <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
            {layers.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition-all font-sans cursor-pointer"
          id="btn-close-layers"
        >
          Close
        </button>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[calc(100vh-12rem)]" id="layers-list-scroll">
        <AnimatePresence initial={false}>
          {reversedLayers.map((layer, index) => {
            const originalIndex = layers.findIndex((l) => l.id === layer.id);
            const isActive = layer.id === activeLayerId;
            const hasThumbnail = !!layerThumbnails[layer.id];
            const isEditing = editingId === layer.id;

            return (
              <motion.div
                key={layer.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative rounded-xl border p-3 flex flex-col transition-all group ${
                  isActive
                    ? 'border-indigo-200 bg-indigo-50/20 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                id={`layer-row-${layer.id}`}
              >
                {/* Header of layer card */}
                <div className="flex items-center gap-2.5">
                  {/* Layer check active handle / thumbnail */}
                  <div
                    onClick={() => onSelectLayer(layer.id)}
                    className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 cursor-pointer flex-shrink-0 flex items-center justify-center [background-image:linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] [background-size:6px_6px] [background-position:0_0,0_3px,3px_-3px,-3px_0] relative hover:opacity-90 active:scale-95 transition-all"
                  >
                    {hasThumbnail ? (
                      <img
                        src={layerThumbnails[layer.id]}
                        alt=""
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-[10px] text-gray-400 font-mono">blank</div>
                    )}
                    {isActive && (
                      <div className="absolute inset-0 border-2 border-indigo-500 rounded-lg pointer-events-none" />
                    )}
                  </div>

                  {/* Name and interaction info */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSave(layer.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="w-full text-xs font-semibold px-1 py-0.5 border border-indigo-400 rounded bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          autoFocus
                          id={`input-rename-layer-${layer.id}`}
                        />
                        <button
                          onClick={() => handleRenameSave(layer.id)}
                          className="p-0.5 rounded text-green-600 hover:bg-green-50"
                          id={`btn-save-rename-${layer.id}`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-0.5 rounded text-red-600 hover:bg-red-50"
                          id={`btn-cancel-rename-${layer.id}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 group/name">
                        <span
                          onClick={() => onSelectLayer(layer.id)}
                          className={`text-xs font-semibold truncate cursor-pointer font-sans ${
                            isActive ? 'text-indigo-900 font-bold' : 'text-gray-700'
                          }`}
                          id={`text-layer-name-${layer.id}`}
                        >
                          {layer.name}
                        </span>
                        <button
                          onClick={() => startRename(layer)}
                          className="opacity-0 group-hover/name:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 rounded transition-opacity"
                          title="Rename layer"
                          id={`btn-trigger-rename-${layer.id}`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="text-[10px] text-gray-400 font-mono mt-0.5 mt-1 flex items-center gap-2">
                      <span>Opacity: {Math.round(layer.opacity * 100)}%</span>
                      {!layer.visible && (
                        <span className="text-red-500 flex items-center gap-0.5">
                          Hidden
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col gap-0.5 justify-center">
                    {/* Layer Move Controls */}
                    <button
                      onClick={() => onMoveLayer(layer.id, 'up')}
                      disabled={index === 0} // visual top cannot go up
                      className={`p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-20 cursor-pointer`}
                      title="Move up"
                      id={`btn-moveup-layer-${layer.id}`}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onMoveLayer(layer.id, 'down')}
                      disabled={index === layers.length - 1} // visual bottom cannot go down
                      className={`p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-20 cursor-pointer`}
                      title="Move down"
                      id={`btn-movedown-layer-${layer.id}`}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Foot/Auxiliary actions for selected layers or hovering */}
                <div className="flex items-center justify-between border-t border-gray-50/50 mt-2.5 pt-2">
                  <div className="flex gap-1">
                    {/* Visibility toggle */}
                    <button
                      onClick={() => onToggleVisibility(layer.id)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        layer.visible
                          ? 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          : 'border-red-100 text-red-500 bg-red-50 hover:bg-red-100/50'
                      }`}
                      title={layer.visible ? 'Hide layer' : 'Show layer'}
                      id={`btn-visible-${layer.id}`}
                    >
                      {layer.visible ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Opacity Drawer Toggle */}
                    <button
                      onClick={() =>
                        setShowOpacitySliderId(
                          showOpacitySliderId === layer.id ? null : layer.id
                        )
                      }
                      className={`p-1.5 rounded-lg border cursor-pointer transition-all ${
                        showOpacitySliderId === layer.id
                          ? 'border-indigo-200 text-indigo-600 bg-indigo-50'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                      title="Adjust layer opacity"
                      id={`btn-opacity-slider-toggle-${layer.id}`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Trash action */}
                  <button
                    onClick={() => onDeleteLayer(layer.id)}
                    disabled={layers.length <= 1}
                    className="p-1.5 rounded-lg border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50/20 disabled:hover:bg-transparent disabled:opacity-30 disabled:border-gray-100 disabled:text-gray-300 transition-all cursor-pointer"
                    title={
                      layers.length <= 1
                        ? 'Cannot delete only remaining layer'
                        : 'Delete layer'
                    }
                    id={`btn-trash-layer-${layer.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Expandable Opacity slider */}
                {showOpacitySliderId === layer.id && (
                  <div className="mt-2.5 p-2 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-gray-500">Opacity:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={layer.opacity}
                      onChange={(e) => onChangeOpacity(layer.id, parseFloat(e.target.value))}
                      className="flex-1 h-1 bg-gray-200 rounded appearance-none cursor-pointer accent-indigo-600"
                      id={`layer-opacity-slider-input-${layer.id}`}
                    />
                    <span className="text-[10px] font-mono text-gray-600 w-8 text-right">
                      {Math.round(layer.opacity * 100)}%
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer Add layer */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <button
          onClick={onAddLayer}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-98 cursor-pointer transition-all font-sans"
          id="btn-add-layer"
        >
          <Plus className="w-4 h-4" /> Add New Layer
        </button>
      </div>
    </motion.div>
  );
}
