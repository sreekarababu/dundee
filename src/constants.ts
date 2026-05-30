/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrushType, BrushSettings, CanvasBackground } from './types';

export const BRUSH_PRESETS: Record<BrushType, BrushSettings> = {
  pencil: {
    size: 4,
    opacity: 0.7,
    color: '#718096',
  },
  pen: {
    size: 6,
    opacity: 1.0,
    color: '#1a1a1a',
  },
  marker: {
    size: 24,
    opacity: 0.4,
    color: '#fbbc05',
  },
  chalk: {
    size: 16,
    opacity: 0.82,
    color: '#ea4335',
  },
  eraser: {
    size: 30,
    opacity: 1.0,
    color: '#ffffff', // Value doesn't matter much as it uses destination-out, but size is key
  },
};

export const COLOR_PALETTE = [
  '#1a1a1a', // Charcoal Black
  '#4a5568', // Slate Grey
  '#718096', // Cool Light Grey
  '#ffffff', // White
  '#ea4335', // Google Red
  '#ff6b6b', // Coral
  '#fbbc05', // Google Yellow
  '#34a853', // Google Green
  '#06b6d4', // Ocean Teal
  '#4285f4', // Google Blue
  '#6366f1', // Royal Blue
  '#9c27b0', // Purple Orchid
  '#e91e63', // Rose Pink
  '#795548', // Warm Brown
];

export const BACKGROUND_COLORS = [
  { name: 'Classic White', value: '#ffffff', isDark: false },
  { name: 'Warm Cream', value: '#faf6ee', isDark: false },
  { name: 'Chalkboard Green', value: '#1b4d3e', isDark: true },
  { name: 'Cosmic Slate', value: '#202124', isDark: true },
  { name: 'Soft Grey', value: '#f1f3f4', isDark: false },
];

export const DEFAULT_BACKGROUND: CanvasBackground = {
  color: '#ffffff',
  pattern: 'blank',
};
