export interface PlaceModel {
  id: string;
  name: string;
  region: string;
  type: string;
  seasonTypes: string[];
  lat: number;
  lng: number;
  images: string[];
  description: string;
  tags: string[];
  baseRating: number;
  isPublished: boolean;
  createdAt?: Date | null;
  routeFileUrl?: string | null;
  videoUrl?: string | null;
  phone?: string | null;
}

export interface ReviewModel {
  id: string;
  placeId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  rating: number;
  text: string;
  images: string[];
  isPublished: boolean;
  createdAt: Date;
}

export type Theme = 'light' | 'dark';

export const PLACE_TYPES = [
  { id: 'toglar', label: "Tog'lar", icon: '⛰️' },
  { id: 'choqqilar', label: "Cho'qqilar", icon: '🏔️' },
  { id: 'adirlar', label: 'Adirlar', icon: '🌄' },
  { id: 'sharsharalar', label: 'Sharsharalar', icon: '💧' },
  { id: 'kollar', label: "Ko'llar", icon: '🏞️' },
  { id: 'orollar', label: 'Orollar', icon: '🏝️' },
  { id: 'sohillar', label: 'Sohillar', icon: '🌊' },
  { id: 'chollar', label: "Cho'llar", icon: '🏜️' },
  { id: 'gorlar', label: "G'orlar", icon: '🪨' },
];

export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
export const SEASON_UZ: Record<string, string> = {
  Spring: 'Bahor', Summer: 'Yoz', Autumn: 'Kuz', Winter: 'Qish',
};

export const ALL_TAGS = [
  'hiking','waterfall','wildlife','camping','skiing','swimming',
  'boating','picnic','mountain','trekking','forest','river','lake','valley','walking','botanical','nature reserve',
];
export const TAG_UZ: Record<string, string> = {
  hiking: 'Piyoda sayohat', waterfall: 'Sharsara', wildlife: 'Yovvoyi tabiat',
  camping: 'Lager', skiing: "Chang'i", swimming: 'Suzish', boating: 'Qayiq',
  picnic: 'Piknik', mountain: "Tog'", trekking: 'Treking', forest: "O'rmon",
  river: 'Daryo', lake: "Ko'l", valley: 'Vodiy', walking: 'Yurish',
  botanical: 'Botanika', 'nature reserve': "Qo'riqxona",
};
