export interface Character {
  id: number;
  name: string;
  gender: string;
  age: string;
  description: string;
  images: { url: string; data?: string; mimeType?: string }[];
}

export interface LocationModel {
  id: number;
  name: string;
  description: string;
  image: { url: string; data?: string; mimeType?: string } | null;
}

export interface AccessoryModel {
  id: number;
  name: string;
  description: string;
  image: { url: string; data?: string; mimeType?: string } | null;
}

export interface BlockingElement {
  id: number;
  type: 'camera' | 'actor' | 'light' | 'prop';
  label: string;
  x: number;
  y: number;
  rotation: number;
  color: string;
  height?: number;
  pitch?: number;
  focalLength?: number;
  intensity?: number;
}

export interface BlockingData {
  elements: BlockingElement[];
}

export interface MultiCamOption {
  id: string;
  camLabel: string;
  type: string;
  cameraAngle: string;
  cameraMovement: string;
  specialtyShot: string;
  lighting: string;
  lens: string;
  prompt: string;
}

export interface Shot {
  id: number;
  order?: number;
  category?: string;
  script_snippet?: string;
  type: string;
  cameraAngle: string;
  cameraMovement: string;
  specialtyShot?: string;
  lighting: string;
  timeOfDay: string;
  duration: string;
  prompt: string;
  camera?: string;
  lens?: string;
  locationId?: number | null;
  characters_present?: string[];
  notes?: string;
  aiIdeas?: string;
  blockingData?: BlockingData;
  multiCamOptions?: MultiCamOption[];
  style?: string;
  tone?: string;
  palette?: string;
}

export interface PropsBreakdown {
  props?: string[];
  vfx?: string[];
  sfx?: string[];
  wardrobe?: string[];
}

export interface Scene {
  id: number;
  title: string;
  description: string;
  locationIds?: number[];
  shots: Shot[];
  propsBreakdown?: PropsBreakdown;
  _extractedLocations?: string[];
}
