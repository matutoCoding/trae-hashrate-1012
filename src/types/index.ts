export interface Point {
  x: number;
  y: number;
}

export interface Transform {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export type PartType = 'head' | 'neck' | 'body' | 'arm_upper_l' | 'arm_lower_l' | 'arm_upper_r' | 'arm_lower_r' | 'leg_upper_l' | 'leg_lower_l' | 'leg_upper_r' | 'leg_lower_r' | 'hand_l' | 'hand_r' | 'foot_l' | 'foot_r' | 'other';

export interface Part {
  id: string;
  name: string;
  type: PartType;
  svgPath: string;
  transform: Transform;
  parentJointId?: string;
  childJointId?: string;
  zIndex: number;
  color: string;
}

export interface JointConstraints {
  minAngle: number;
  maxAngle: number;
  locked: boolean;
  reverseAllowed: boolean;
}

export interface Joint {
  id: string;
  name: string;
  partId: string;
  position: Point;
  parentId?: string;
  childId?: string;
  constraints: JointConstraints;
  currentAngle: number;
}

export interface Stick {
  id: string;
  name: string;
  controlPoint: Point;
  targetJointId: string;
  length: number;
  angle: number;
  zIndex: number;
  color: string;
}

export interface JointState {
  angle: number;
  position: Point;
}

export interface StickState {
  angle: number;
  controlPoint: Point;
}

export interface Keyframe {
  id: string;
  time: number;
  joints: Record<string, JointState>;
  sticks: Record<string, StickState>;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface Action {
  id: string;
  name: string;
  category: string;
  characterId: string;
  duration: number;
  keyframes: Keyframe[];
  description: string;
  createdAt: number;
  thumbnail?: string;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  parts: Part[];
  joints: Joint[];
  sticks: Stick[];
  description: string;
}

export interface Clip {
  id: string;
  actionId: string;
  startTime: number;
  duration: number;
  speed: number;
  trackId: string;
}

export interface Track {
  id: string;
  name: string;
  characterId: string;
  clips: Clip[];
  visible: boolean;
  locked: boolean;
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  duration: number;
  tracks: Track[];
}

export interface Drama {
  id: string;
  name: string;
  description: string;
  cover?: string;
  createdAt: number;
  updatedAt: number;
  characters: Character[];
  actions: Action[];
  scenes: Scene[];
  currentSceneId?: string;
}

export interface LightConfig {
  x: number;
  y: number;
  intensity: number;
  blur: number;
  color: string;
}

export type PageType = 'drama' | 'binding' | 'constraints' | 'timeline' | 'library';

export interface ConstraintWarning {
  jointId: string;
  jointName: string;
  message: string;
  severity: 'warning' | 'error';
}

export interface OcclusionInfo {
  stickId1: string;
  stickId2: string;
  stickName1: string;
  stickName2: string;
  intersectionPoint: Point;
  frontStickId: string;
  isCorrect: boolean;
  suggestion: string;
}
