export interface GameDef {
  id: string;
  bn: string;
  desc: string;
  emoji: string;
  color: string;
  /** game needs a topic (category) */
  topic: boolean;
  /** fixed topic shortcut, e.g. colour game = listen + colors */
  presetTopic?: string;
  base?: string;
  minLevel: 1 | 2 | 3;
}

export const GAMES: GameDef[] = [
  { id: 'listen', bn: 'শুনে খুঁজি', desc: 'নাম শুনে সঠিক ছবি ছোঁও', emoji: '👂', color: '#7C5CFC', topic: true, minLevel: 1 },
  { id: 'animals', base: 'listen', presetTopic: 'animals', bn: 'প্রাণী চিনি', desc: 'সঠিক প্রাণীটা খুঁজে বের করো', emoji: '🐘', color: '#E8A33D', topic: false, minLevel: 1 },
  { id: 'colors', base: 'listen', presetTopic: 'colors', bn: 'রং চিনি', desc: 'রঙের নাম শুনে রং খোঁজো', emoji: '🎨', color: '#E84A8A', topic: false, minLevel: 1 },
  { id: 'shapes', base: 'listen', presetTopic: 'shapes', bn: 'আকৃতি চিনি', desc: 'আকৃতির নাম শুনে খোঁজো', emoji: '🔺', color: '#22A7A0', topic: false, minLevel: 1 },
  { id: 'memory', bn: 'মেমোরি মিল', desc: 'একই রকম দুটো ছবি মেলাও', emoji: '🃏', color: '#3FB47C', topic: true, minLevel: 1 },
  { id: 'count', bn: 'গুনে দেখি', desc: 'কয়টা আছে গুনে বলো', emoji: '🔢', color: '#4C8BF5', topic: false, minLevel: 1 },
  { id: 'odd', bn: 'কোনটা আলাদা', desc: 'দলের বাইরের ছবিটা খোঁজো', emoji: '🔍', color: '#FF7A59', topic: false, minLevel: 1 },
  { id: 'missing', bn: 'কোনটা হারালো', desc: 'দেখে মনে রাখো, কোনটা নেই বলো', emoji: '🙈', color: '#AB47BC', topic: true, minLevel: 2 },
  { id: 'quiz', bn: 'ছবি দেখে নাম', desc: 'ছবির সঠিক নামটা ছোঁও', emoji: '📝', color: '#00897B', topic: true, minLevel: 2 },
  { id: 'add', bn: 'যোগের মজা', desc: 'দুই দল মিলে কয়টা হলো?', emoji: '➕', color: '#F4511E', topic: false, minLevel: 2 },
];

export const gameById = new Map(GAMES.map((g) => [g.id, g]));
