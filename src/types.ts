/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BrushType = 'pencil' | 'pen' | 'marker' | 'chalk' | 'eraser';

export interface BrushSettings {
  size: number;     // 1 to 100
  opacity: number;  // 0 to 1
  color: string;    // CSS/Hex color
}

export interface LayerState {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;  // 0 to 1
  canvasData?: string; // Data URL for restoring the layer
}

export type PaperPattern = 'blank' | 'ruled-narrow' | 'ruled-wide' | 'grid';

export interface CanvasBackground {
  color: string;
  pattern: PaperPattern;
}

export interface DrawingProject {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string; // High-level consolidated drawing preview
  layers: LayerState[];
  background: CanvasBackground;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user';
  package_type: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  tokens_remaining: number;
  total_tokens_used: number;
  api_provider: string;
  account_status: 'ACTIVE' | 'SUSPENDED';
  created_at: string;
}

export interface ApiLog {
  id: string;
  user_id: string;
  email: string;
  api_used: string;
  tokens_consumed: number;
  request_type: string;
  created_at: string;
}

export interface SmtpLog {
  id: string;
  email: string;
  type: string;
  smtp_status: 'SUCCESS' | 'FAILED' | 'SIMULATED';
  timestamp: string;
}

