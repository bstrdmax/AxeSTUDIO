// types.ts
import React from 'react';

// Defines the possible positions for overlays on the video canvas.
export type OverlayPlacement = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// Defines the layout modes for arranging multiple video sources on the canvas.
export type LayoutMode = 'solo' | 'pip' | 'side-by-side' | 'hero-below' | 'split-vertical' | 'cinematic' | 'sidebar';

// Defines the types of media sources the application can handle.
export type SourceType = 'camera' | 'screen' | 'guest';

// Defines the possible views/pages within the main dashboard.
export type DashboardView = 'home' | 'library' | 'destinations';

// Represents a single bullet list that can be created and saved.
export interface BulletList {
  id: string;
  title: string;
  items: string; // Stored as a single string, items separated by newlines
  theme: 'default' | 'primary';
  font: string;
  textSize: number; // Multiplier, e.g., 1.0 for default
  backgroundOpacity: number; // 0.0 to 1.0
}

// Interface for all overlay settings, controlling visual elements like logos, banners, and filters.
export interface OverlaySettings {
  logo: {
    show: boolean;
    placement: OverlayPlacement;
    url: string | null;
  };
  banner: {
    show: boolean;
    text: string;
    theme: 'default' | 'primary';
    font: string;
    textSize: number; // Multiplier
    backgroundOpacity: number; // 0-1
  };
  lowerThird: {
    show: boolean;
    title: string;
    subtitle: string;
    theme: 'default' | 'primary';
    font: string;
    textSize: number; // Multiplier
    backgroundOpacity: number; // 0-1
  };
  overlay: {
    show: boolean;
    style: string; // 'none', 'geometric', 'wave', etc. for procedural
    url: string | null; // For uploaded image/video
    type: 'procedural' | 'image' | 'video';
    opacity: number; // 0-1
    size: number; // 0-1, percentage of canvas width
  };
  filters: {
    brightness: number;
    contrast: number;
    saturate: number;
    grayscale: boolean;
  };
  countdown: {
    show: boolean;
    duration: number; // in minutes
    title: string;
    theme: 'default' | 'primary';
    running: boolean;
  };
  ticker: {
    show: boolean;
    text: string;
    theme: 'default' | 'primary';
  };
  bulletLists: {
    lists: BulletList[];
    activeListId: string | null;
    show: boolean;
    placement: OverlayPlacement;
  };
  textOverlay: {
    show: boolean;
    text: string;
    font: string;
    size: number; // percentage of canvas height
    color: string;
    isBold: boolean;
    isItalic: boolean;
    placement: OverlayPlacement;
    backgroundColor: string;
    backgroundOpacity: number; // 0-1
  };
}

// Interface for a streaming destination (e.g., YouTube, Twitch).
export interface Destination {
  id: string;
  name: string;
  icon: React.ReactNode;
}

// Represents a single media source, such as a camera or screen share.
export interface Source {
  id: string;          // Unique identifier for the source.
  name: string;        // Display name for the source.
  type: SourceType;    // The type of the source ('camera' or 'screen').
  stream: MediaStream; // the actual WebRTC MediaStream from the device.
  isMuted: boolean;    // The current mute state of the source's audio track.
}

// Represents a saved preset of layout and overlay settings.
export interface Preset {
  id: string;
  name: string;
  settings: OverlaySettings;
  layout: LayoutMode;
}

// Represents a completed recording.
export interface Recording {
  id: string;
  name: string;
  url: string;
  createdAt: string; // ISO 8601 date string
  duration: number; // in seconds
}