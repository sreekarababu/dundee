/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, Upload, Trash2, Calendar, FileText, 
  ChevronRight, Edit, LayoutGrid, AlertCircle 
} from 'lucide-react';
import { DrawingProject } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface GalleryProps {
  projects: DrawingProject[];
  userEmail?: string;
  onCreateNew: () => void;
  onCreateFromImage: (file: File) => void;
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, newTitle: string) => void;
}

export default function Gallery({
  projects,
  userEmail,
  onCreateNew,
  onCreateFromImage,
  onSelectProject,
  onDeleteProject,
  onRenameProject,
}: GalleryProps) {
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [renameProgress, setRenameProgress] = useState('');
  const [showDeleteConfirmId, setShowDeleteConfirmId] = useState<string | null>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onCreateFromImage(e.target.files[0]);
    }
  };

  const handleRenameBtnClick = (project: DrawingProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setRenameProgress(project.title);
  };

  const handleRenameSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (renameProgress.trim()) {
      onRenameProject(id, renameProgress.trim());
    }
    setEditingProjectId(null);
  };

  const formattedDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col select-none px-4 sm:px-8 py-6 pb-16" id="canvas-gallery-view">
      {/* Sleek Header & Branding consistent with Canva design */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between gap-4 mb-6 mt-2 pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-indigo-650 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/10">
            <span className="text-white font-bold text-xl font-sans">C</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900 font-sans">CanvasCloud</span>
        </div>

        {/* User Identity and Quick Creation buttons */}
        <div className="flex items-center gap-3">
          {userEmail && (
            <div className="hidden sm:flex flex-col items-end mr-1 font-sans">
              <span className="text-[9px] font-bold text-gray-400 uppercase font-mono tracking-wider">LOGGED IN</span>
              <span className="text-xs font-semibold text-gray-600">{userEmail}</span>
            </div>
          )}
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all font-sans shadow-sm"
            id="gallery-btn-new-drawing"
          >
            <Plus className="w-4 h-4" />
            <span>Create drawing</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col space-y-6">
        {/* Sleek Hero Banner */}
        <section className="bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg h-44 flex flex-col justify-center">
          <div className="relative z-10 max-w-xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">What will you design today?</h1>
            <p className="text-indigo-100 text-xs sm:text-sm">Start from scratch or use professional grid background presets to compose your sketch.</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <div className="w-48 h-48 bg-white rounded-full"></div>
          </div>
        </section>

        {/* Canva Categories/Presets row with real action bindings */}
        <section className="flex flex-wrap items-center justify-start gap-4 sm:gap-6 py-2">
          <div 
            onClick={onCreateNew}
            className="flex flex-col items-center space-y-2 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-xl group-hover:shadow-md transition-shadow group-hover:border-indigo-100">📋</div>
            <span className="text-[11px] font-semibold text-gray-600">Blank Doc</span>
          </div>

          <div 
            onClick={onCreateNew}
            className="flex flex-col items-center space-y-2 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-xl group-hover:shadow-md transition-shadow group-hover:border-indigo-100">📽️</div>
            <span className="text-[11px] font-semibold text-gray-600">Presentation</span>
          </div>

          <label 
            className="flex flex-col items-center space-y-2 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-xl group-hover:shadow-md transition-shadow group-hover:border-indigo-100/50">📷</div>
            <span className="text-[11px] font-semibold text-gray-600">Trace Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="sr-only"
            />
          </label>

          <div 
            onClick={onCreateNew}
            className="flex flex-col items-center space-y-2 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-xl group-hover:shadow-md transition-shadow group-hover:border-indigo-100">🎬</div>
            <span className="text-[11px] font-semibold text-gray-600">Storyboard</span>
          </div>

          <div 
            onClick={onCreateNew}
            className="flex flex-col items-center space-y-2 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-xl group-hover:shadow-md transition-shadow group-hover:border-indigo-100">🌐</div>
            <span className="text-[11px] font-semibold text-gray-600">Web Design</span>
          </div>
        </section>

        {/* Recent Designs Header */}
        <div className="flex justify-between items-center pt-2">
          <h2 className="text-base font-bold text-gray-800 tracking-tight flex items-center gap-1.5 font-sans">
            <LayoutGrid className="w-4 h-4 text-indigo-500" />
            <span>Recent designs</span>
          </h2>
          <span className="text-xs font-mono font-bold text-gray-400 uppercase">({projects.length})</span>
        </div>

        {projects.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white border border-gray-200 rounded-2xl p-12 py-16 flex flex-col items-center justify-center text-center shadow-xs select-none"
            id="gallery-empty-state-card"
          >
            <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-none stroke-current stroke-1.8">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <line x1="2" y1="2" x2="9.5" y2="3.5" />
              </svg>
            </div>
            <h3 className="font-sans font-extrabold text-base text-gray-800 leading-tight mb-2">
              No drawings yet
            </h3>
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed mb-6 font-sans">
              Create a new blank canvas or upload a base image to start designing with custom layer editing features.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCreateNew}
                className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-semibold rounded-lg shadow-sm hover:shadow-indigo-500/10 active:scale-95 cursor-pointer transition-transform"
                id="empty-btn-create-blank"
              >
                Create blank canvas
              </button>
            </div>
          </motion.div>
        ) : (
          /* Projects grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-1" id="drawings-cards-grid">
            <AnimatePresence initial={false}>
              {projects.map((project) => {
                const isEditingTitle = editingProjectId === project.id;
                const isShowingDelete = showDeleteConfirmId === project.id;

                return (
                  <motion.div
                    key={project.id}
                    layoutId={`project-card-${project.id}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => {
                      if (!isEditingTitle && !isShowingDelete) {
                        onSelectProject(project.id);
                      }
                    }}
                    className="group flex flex-col bg-white border border-gray-200 hover:border-indigo-400 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 overflow-hidden relative"
                    id={`project-card-container-${project.id}`}
                  >
                    {/* Thumbnail view */}
                    <div className="aspect-video w-full border-b border-gray-100 flex items-center justify-center [background-image:linear-gradient(45deg,#fafafa_25%,transparent_25%),linear-gradient(-45deg,#fafafa_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#fafafa_75%),linear-gradient(-45deg,transparent_75%,#fafafa_75%)] [background-size:6px_6px] [background-position:0_0,0_3px,3px_-3px,-3px_0] relative overflow-hidden bg-white group-hover:opacity-95 transition-opacity">
                      {project.thumbnail ? (
                        <img
                          src={project.thumbnail}
                          alt={project.title}
                          className="w-full h-full object-contain pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-gray-300">
                          <FileText className="w-8 h-8 stroke-1.2" />
                          <span className="text-[9px] font-bold tracking-widest font-mono uppercase">
                            BLANK CANVAS
                          </span>
                        </div>
                      )}

                      {/* Small floating indicators */}
                      <span className="absolute bottom-2 left-2 bg-indigo-900/80 backdrop-blur-md text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs">
                        {project.layers.length} {project.layers.length === 1 ? 'Layer' : 'Layers'}
                      </span>
                    </div>

                    {/* Metadata Content block */}
                    <div className="p-3 flex-1 flex flex-col justify-between" id={`project-card-content-${project.id}`}>
                      {isEditingTitle ? (
                        <div
                          className="flex items-center gap-1.5 w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={renameProgress}
                            onChange={(e) => setRenameProgress(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameSave(project.id, e);
                              if (e.key === 'Escape') setEditingProjectId(null);
                            }}
                            className="w-full text-xs font-semibold px-2 py-1 border border-indigo-400 rounded-lg focus:outline-none bg-white text-gray-800"
                            autoFocus
                            id={`input-project-rename-${project.id}`}
                          />
                          <button
                            onClick={(e) => handleRenameSave(project.id, e)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-1 rounded-lg shadow cursor-pointer"
                            id={`btn-save-project-rename-${project.id}`}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className="font-sans font-bold text-sm text-gray-800 truncate group-hover:text-indigo-700 transition-colors"
                              title={project.title}
                              id={`title-text-${project.id}`}
                            >
                              {project.title}
                            </h4>
                            <button
                              onClick={(e) => handleRenameBtnClick(project, e)}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-605 hover:bg-gray-100 p-1 rounded-md transition-all cursor-pointer"
                              title="Rename project"
                              id={`btn-trigger-project-rename-${project.id}`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-sans mt-1">
                            <Calendar className="w-3 h-3 text-gray-300" />
                            <span>Edited {formattedDate(project.updatedAt)}</span>
                          </div>
                        </div>
                      )}

                      {/* Hover action delete buttons */}
                      <div className="border-t border-gray-50/50 mt-2.5 pt-2.5 flex items-center justify-end">
                        {isShowingDelete ? (
                          <div
                            className="flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-[10px] font-bold text-red-500 font-sans flex items-center gap-0.5 mr-1">
                              <AlertCircle className="w-3.5 h-3.5" /> Sure?
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteProject(project.id);
                              }}
                              className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
                              id={`btn-confirm-card-delete-${project.id}`}
                            >
                              Yes
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirmId(null);
                              }}
                              className="px-2 py-0.5 text-gray-500 text-[10px] font-semibold border border-gray-200 rounded hover:bg-gray-50 bg-white transition-colors cursor-pointer"
                              id={`btn-cancel-card-delete-${project.id}`}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirmId(project.id);
                            }}
                            className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1 rounded-md border border-transparent hover:border-red-100 cursor-pointer transition-all"
                            title="Delete Drawing"
                            id={`btn-card-trash-${project.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
