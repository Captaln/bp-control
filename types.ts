export enum AppView {
  DASHBOARD = 'DASHBOARD',
  VENT = 'VENT',
  BREATHE = 'BREATHE',
  LAUGH = 'LAUGH',
  PLAY = 'PLAY',
  TRACK = 'TRACK'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export interface BubbleState {
  id: number;
  popped: boolean;
  size: 'small' | 'medium' | 'large';
  color: string;
}

export interface MoodLog {
  id: string;
  timestamp: number;
  intensity: number;
  triggers: string[];
  coping: string[];
  note?: string;
}

export interface Meme {
  id: string;
  type: 'image' | 'video';
  url: string;
  title: string;
  likes: number;
  category: string;
}