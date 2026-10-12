export type AvatarEmotion =
  | 'happy'
  | 'cool_peace'
  | 'squish_cheek'
  | 'thinking'
  | 'surprised'
  | 'empathy'
  | 'playful'
  | 'idle';

export type AvatarGesture =
  | 'peace_sign'
  | 'wave'
  | 'think'
  | 'thumbs_up'
  | 'bounce'
  | 'idle';

export interface ChatSentiment {
  mood: 'happy' | 'swag' | 'thinking' | 'surprised' | 'empathy' | 'playful' | 'squishy' | 'neutral';
  score: number; // -1.0 to 1.0
  label: string; // e.g. "Positif & Hype", "Curhat / Galau", "Penasaran"
  userEmotion: string;
}

export interface VoiceToneConfig {
  pitch: number;
  rate: number;
  style: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'sibebeb';
  text: string;
  timestamp: number;
  sentiment?: ChatSentiment;
  expression?: AvatarEmotion;
  gesture?: AvatarGesture;
  audioBase64?: string;
  isStreaming?: boolean;
}

export type PersonalityArchetype =
  | 'cute_girl'
  | 'swag_bestie'
  | 'cute_brother'
  | 'hype_man'
  | 'wise_mentor'
  | 'comedian'
  | 'custom';

export type LanguageCode =
  | 'id-slang'
  | 'id-formal'
  | 'en'
  | 'jv'
  | 'su'
  | 'ja';

export interface SibebebConfig {
  archetype: PersonalityArchetype;
  slangLevel: number; // 0 (Formal) to 100 (Gaul Habis)
  humorLevel: number; // 0 to 100
  warmthLevel: number; // 0 to 100
  swagLevel: number; // 0 to 100
  responseLength: 'short' | 'medium' | 'detailed';
  language: LanguageCode;
  customCatchphrase: string;
  voiceEngine: 'gemini_tts' | 'web_speech';
  geminiVoice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  speechPitch: number; // 0.5 to 2.0 (higher = cute child girl)
  speechRate: number; // 0.5 to 2.0
  autoSpeak: boolean;
  backgroundTheme: 'street_night' | 'cyber_gold' | 'neon_studio' | 'cozy_room';
  squishSensitivity: number;
  customAvatarImage?: string; // Base64 or URL of user uploaded character photo
}
