export type CarId = 'lightning_gt' | 'neon_phantom' | 'titan_4x4' | 'cipher_vortex';

export interface CarConfig {
  id: CarId;
  name: string;
  nameRu: string;
  type: string;
  desc: string;
  maxSpeed: number; // km/h (e.g. 210, 260, etc.)
  acceleration: number; // 1-10
  handling: number; // 1-10
  maxHealth: number; // 2-5
  color: string;
  accentColor: string;
  price: number;
}

export interface PlayerCar {
  x: number; // lane position (px)
  y: number; // vertical position
  speed: number; // current speed in km/h
  steerAngle: number; // body tilt angle (-0.15 to +0.15 rad)
  health: number;
  maxHealth: number;
  nitro: number; // 0 - 100
  maxNitro: number;
  isNitroActive: boolean;
  isBraking: boolean;
  invincibleTimer: number;
}

export type TrafficType = 'sedan' | 'sport' | 'truck' | 'taxi';

export interface TrafficCar {
  id: number;
  lane: number; // 0, 1, 2, 3
  x: number;
  y: number;
  speed: number; // in km/h
  type: TrafficType;
  color: string;
  accentColor?: string;
  width: number;
  height: number;
  isOvertaken: boolean;
  oncoming: boolean; // if true, moves toward player
}

export type RoadItemType = 'coin' | 'nitro' | 'repair';

export interface RoadItem {
  id: number;
  lane: number;
  x: number;
  y: number;
  type: RoadItemType;
  collected: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface FloatingBonus {
  id: number;
  text: string;
  points: number;
  x: number;
  y: number;
  life: number;
  color: string;
}

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover';
