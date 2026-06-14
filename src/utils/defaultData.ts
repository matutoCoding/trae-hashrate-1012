import { Drama, Character, Part, Joint, Stick, Action, Keyframe, Point } from '../types';

export interface JointIdMap {
  neck: string;
  bodyTop: string;
  leftShoulder: string;
  leftElbow: string;
  leftWrist: string;
  rightShoulder: string;
  rightElbow: string;
  rightWrist: string;
  leftHip: string;
  leftKnee: string;
  leftAnkle: string;
  rightHip: string;
  rightKnee: string;
  rightAnkle: string;
}

export interface StickIdMap {
  main: string;
  leftHand: string;
  rightHand: string;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function getJointPosition(angle: number, baseX: number, baseY: number): Point {
  const rad = (angle * Math.PI) / 180;
  return {
    x: baseX + Math.sin(rad) * 10,
    y: baseY + Math.cos(rad) * 10,
  };
}

export function createDefaultCharacter(): { character: Character; jointIdMap: JointIdMap; stickIdMap: StickIdMap } {
  const characterId = generateId();
  
  const parts: Part[] = [
    {
      id: generateId(),
      name: '头部',
      type: 'head',
      svgPath: 'M -25 -35 Q -25 -55 0 -60 Q 25 -55 25 -35 L 25 10 Q 20 20 0 22 Q -20 20 -25 10 Z',
      transform: { x: 0, y: -80, rotation: 0, scale: 1 },
      zIndex: 10,
      color: '#3D2914',
    },
    {
      id: generateId(),
      name: '身体',
      type: 'body',
      svgPath: 'M -35 -40 L -30 60 Q 0 70 30 60 L 35 -40 Q 0 -50 -35 -40 Z',
      transform: { x: 0, y: 0, rotation: 0, scale: 1 },
      zIndex: 5,
      color: '#8B1A1A',
    },
    {
      id: generateId(),
      name: '左上臂',
      type: 'arm_upper_l',
      svgPath: 'M -8 -10 L -8 45 Q 0 50 8 45 L 8 -10 Q 0 -15 -8 -10 Z',
      transform: { x: -40, y: -20, rotation: 30, scale: 1 },
      zIndex: 6,
      color: '#8B1A1A',
    },
    {
      id: generateId(),
      name: '左下臂',
      type: 'arm_lower_l',
      svgPath: 'M -6 -5 L -6 40 Q 0 45 6 40 L 6 -5 Q 0 -10 -6 -5 Z',
      transform: { x: -55, y: 25, rotation: 10, scale: 1 },
      zIndex: 7,
      color: '#A0522D',
    },
    {
      id: generateId(),
      name: '右上臂',
      type: 'arm_upper_r',
      svgPath: 'M -8 -10 L -8 45 Q 0 50 8 45 L 8 -10 Q 0 -15 -8 -10 Z',
      transform: { x: 40, y: -20, rotation: -30, scale: 1 },
      zIndex: 4,
      color: '#8B1A1A',
    },
    {
      id: generateId(),
      name: '右下臂',
      type: 'arm_lower_r',
      svgPath: 'M -6 -5 L -6 40 Q 0 45 6 40 L 6 -5 Q 0 -10 -6 -5 Z',
      transform: { x: 55, y: 25, rotation: -10, scale: 1 },
      zIndex: 3,
      color: '#A0522D',
    },
    {
      id: generateId(),
      name: '左大腿',
      type: 'leg_upper_l',
      svgPath: 'M -10 -5 L -10 50 Q 0 55 10 50 L 10 -5 Q 0 -10 -10 -5 Z',
      transform: { x: -18, y: 60, rotation: -5, scale: 1 },
      zIndex: 5,
      color: '#2F4F4F',
    },
    {
      id: generateId(),
      name: '左小腿',
      type: 'leg_lower_l',
      svgPath: 'M -8 -3 L -8 45 Q 0 50 8 45 L 8 -3 Q 0 -8 -8 -3 Z',
      transform: { x: -20, y: 110, rotation: 5, scale: 1 },
      zIndex: 4,
      color: '#3D2914',
    },
    {
      id: generateId(),
      name: '右大腿',
      type: 'leg_upper_r',
      svgPath: 'M -10 -5 L -10 50 Q 0 55 10 50 L 10 -5 Q 0 -10 -10 -5 Z',
      transform: { x: 18, y: 60, rotation: 5, scale: 1 },
      zIndex: 4,
      color: '#2F4F4F',
    },
    {
      id: generateId(),
      name: '右小腿',
      type: 'leg_lower_r',
      svgPath: 'M -8 -3 L -8 45 Q 0 50 8 45 L 8 -3 Q 0 -8 -8 -3 Z',
      transform: { x: 20, y: 110, rotation: -5, scale: 1 },
      zIndex: 5,
      color: '#3D2914',
    },
  ];

  const neckJointId = generateId();
  const bodyTopJointId = generateId();
  const leftShoulderId = generateId();
  const leftElbowId = generateId();
  const leftWristId = generateId();
  const rightShoulderId = generateId();
  const rightElbowId = generateId();
  const rightWristId = generateId();
  const leftHipId = generateId();
  const leftKneeId = generateId();
  const leftAnkleId = generateId();
  const rightHipId = generateId();
  const rightKneeId = generateId();
  const rightAnkleId = generateId();

  const joints: Joint[] = [
    {
      id: neckJointId,
      name: '颈部',
      partId: parts[0].id,
      position: { x: 0, y: 20 },
      childId: bodyTopJointId,
      constraints: { minAngle: -30, maxAngle: 30, locked: false, reverseAllowed: false },
      currentAngle: 0,
    },
    {
      id: bodyTopJointId,
      name: '躯干顶',
      partId: parts[1].id,
      position: { x: 0, y: -40 },
      parentId: neckJointId,
      childId: leftShoulderId,
      constraints: { minAngle: -20, maxAngle: 20, locked: false, reverseAllowed: false },
      currentAngle: 0,
    },
    {
      id: leftShoulderId,
      name: '左肩',
      partId: parts[2].id,
      position: { x: -8, y: -10 },
      parentId: bodyTopJointId,
      childId: leftElbowId,
      constraints: { minAngle: -90, maxAngle: 120, locked: false, reverseAllowed: true },
      currentAngle: 30,
    },
    {
      id: leftElbowId,
      name: '左肘',
      partId: parts[3].id,
      position: { x: 0, y: -5 },
      parentId: leftShoulderId,
      childId: leftWristId,
      constraints: { minAngle: 0, maxAngle: 130, locked: false, reverseAllowed: false },
      currentAngle: 40,
    },
    {
      id: leftWristId,
      name: '左腕',
      partId: parts[3].id,
      position: { x: 0, y: 40 },
      parentId: leftElbowId,
      constraints: { minAngle: -45, maxAngle: 45, locked: false, reverseAllowed: true },
      currentAngle: 0,
    },
    {
      id: rightShoulderId,
      name: '右肩',
      partId: parts[4].id,
      position: { x: 8, y: -10 },
      parentId: bodyTopJointId,
      childId: rightElbowId,
      constraints: { minAngle: -120, maxAngle: 90, locked: false, reverseAllowed: true },
      currentAngle: -30,
    },
    {
      id: rightElbowId,
      name: '右肘',
      partId: parts[5].id,
      position: { x: 0, y: -5 },
      parentId: rightShoulderId,
      childId: rightWristId,
      constraints: { minAngle: -130, maxAngle: 0, locked: false, reverseAllowed: false },
      currentAngle: -40,
    },
    {
      id: rightWristId,
      name: '右腕',
      partId: parts[5].id,
      position: { x: 0, y: 40 },
      parentId: rightElbowId,
      constraints: { minAngle: -45, maxAngle: 45, locked: false, reverseAllowed: true },
      currentAngle: 0,
    },
    {
      id: leftHipId,
      name: '左胯',
      partId: parts[6].id,
      position: { x: 0, y: -5 },
      parentId: bodyTopJointId,
      childId: leftKneeId,
      constraints: { minAngle: -45, maxAngle: 60, locked: false, reverseAllowed: true },
      currentAngle: -5,
    },
    {
      id: leftKneeId,
      name: '左膝',
      partId: parts[7].id,
      position: { x: 0, y: -3 },
      parentId: leftHipId,
      childId: leftAnkleId,
      constraints: { minAngle: 0, maxAngle: 120, locked: false, reverseAllowed: false },
      currentAngle: 5,
    },
    {
      id: leftAnkleId,
      name: '左脚踝',
      partId: parts[7].id,
      position: { x: 0, y: 45 },
      parentId: leftKneeId,
      constraints: { minAngle: -30, maxAngle: 30, locked: false, reverseAllowed: true },
      currentAngle: 0,
    },
    {
      id: rightHipId,
      name: '右胯',
      partId: parts[8].id,
      position: { x: 0, y: -5 },
      parentId: bodyTopJointId,
      childId: rightKneeId,
      constraints: { minAngle: -60, maxAngle: 45, locked: false, reverseAllowed: true },
      currentAngle: 5,
    },
    {
      id: rightKneeId,
      name: '右膝',
      partId: parts[9].id,
      position: { x: 0, y: -3 },
      parentId: rightHipId,
      childId: rightAnkleId,
      constraints: { minAngle: -120, maxAngle: 0, locked: false, reverseAllowed: false },
      currentAngle: -5,
    },
    {
      id: rightAnkleId,
      name: '右脚踝',
      partId: parts[9].id,
      position: { x: 0, y: 45 },
      parentId: rightKneeId,
      constraints: { minAngle: -30, maxAngle: 30, locked: false, reverseAllowed: true },
      currentAngle: 0,
    },
  ];

  const mainStickId = generateId();
  const leftHandStickId = generateId();
  const rightHandStickId = generateId();

  const sticks: Stick[] = [
    {
      id: mainStickId,
      name: '主签杆',
      controlPoint: { x: 0, y: 250 },
      targetJointId: bodyTopJointId,
      length: 250,
      angle: -90,
      zIndex: 15,
      color: '#8B4513',
    },
    {
      id: leftHandStickId,
      name: '左手签',
      controlPoint: { x: -120, y: 200 },
      targetJointId: leftWristId,
      length: 180,
      angle: -70,
      zIndex: 16,
      color: '#A0522D',
    },
    {
      id: rightHandStickId,
      name: '右手签',
      controlPoint: { x: 120, y: 200 },
      targetJointId: rightWristId,
      length: 180,
      angle: -110,
      zIndex: 14,
      color: '#A0522D',
    },
  ];

  const character: Character = {
    id: characterId,
    name: '张生',
    role: '小生',
    parts,
    joints,
    sticks,
    description: '标准男性角色',
  };

  const jointIdMap: JointIdMap = {
    neck: neckJointId,
    bodyTop: bodyTopJointId,
    leftShoulder: leftShoulderId,
    leftElbow: leftElbowId,
    leftWrist: leftWristId,
    rightShoulder: rightShoulderId,
    rightElbow: rightElbowId,
    rightWrist: rightWristId,
    leftHip: leftHipId,
    leftKnee: leftKneeId,
    leftAnkle: leftAnkleId,
    rightHip: rightHipId,
    rightKnee: rightKneeId,
    rightAnkle: rightAnkleId,
  };

  const stickIdMap: StickIdMap = {
    main: mainStickId,
    leftHand: leftHandStickId,
    rightHand: rightHandStickId,
  };

  return { character, jointIdMap, stickIdMap };
}

export function createWalkAction(
  characterId: string,
  jointIdMap: JointIdMap,
  stickIdMap: StickIdMap
): Action {
  const actionId = generateId();
  
  const keyframes: Keyframe[] = [
    {
      id: generateId(),
      time: 0,
      joints: {
        [jointIdMap.neck]: { angle: 0, position: getJointPosition(0, 0, -60) },
        [jointIdMap.bodyTop]: { angle: 0, position: getJointPosition(0, 0, 0) },
        [jointIdMap.leftShoulder]: { angle: -10, position: getJointPosition(-10, -40, -20) },
        [jointIdMap.leftElbow]: { angle: 30, position: getJointPosition(30, -55, 25) },
        [jointIdMap.leftWrist]: { angle: 0, position: getJointPosition(0, -70, 70) },
        [jointIdMap.rightShoulder]: { angle: 70, position: getJointPosition(70, 40, -20) },
        [jointIdMap.rightElbow]: { angle: -50, position: getJointPosition(-50, 55, 25) },
        [jointIdMap.rightWrist]: { angle: 0, position: getJointPosition(0, 70, 70) },
        [jointIdMap.leftHip]: { angle: 25, position: getJointPosition(25, -18, 60) },
        [jointIdMap.leftKnee]: { angle: 15, position: getJointPosition(15, -20, 110) },
        [jointIdMap.leftAnkle]: { angle: 0, position: getJointPosition(0, -20, 160) },
        [jointIdMap.rightHip]: { angle: -25, position: getJointPosition(-25, 18, 60) },
        [jointIdMap.rightKnee]: { angle: 0, position: getJointPosition(0, 20, 110) },
        [jointIdMap.rightAnkle]: { angle: 0, position: getJointPosition(0, 20, 160) },
      },
      sticks: {
        [stickIdMap.main]: { angle: -90, controlPoint: { x: 0, y: 250 } },
        [stickIdMap.leftHand]: { angle: -70, controlPoint: { x: -80, y: 180 } },
        [stickIdMap.rightHand]: { angle: -110, controlPoint: { x: 80, y: 180 } },
      },
      easing: 'ease-in-out',
    },
    {
      id: generateId(),
      time: 500,
      joints: {
        [jointIdMap.neck]: { angle: 0, position: getJointPosition(0, 0, -60) },
        [jointIdMap.bodyTop]: { angle: 0, position: getJointPosition(0, 0, 0) },
        [jointIdMap.leftShoulder]: { angle: 30, position: getJointPosition(30, -40, -20) },
        [jointIdMap.leftElbow]: { angle: 35, position: getJointPosition(35, -55, 25) },
        [jointIdMap.leftWrist]: { angle: 0, position: getJointPosition(0, -55, 70) },
        [jointIdMap.rightShoulder]: { angle: -30, position: getJointPosition(-30, 40, -20) },
        [jointIdMap.rightElbow]: { angle: -35, position: getJointPosition(-35, 55, 25) },
        [jointIdMap.rightWrist]: { angle: 0, position: getJointPosition(0, 55, 70) },
        [jointIdMap.leftHip]: { angle: 5, position: getJointPosition(5, -18, 60) },
        [jointIdMap.leftKnee]: { angle: 25, position: getJointPosition(25, -20, 110) },
        [jointIdMap.leftAnkle]: { angle: 5, position: getJointPosition(5, -20, 160) },
        [jointIdMap.rightHip]: { angle: -5, position: getJointPosition(-5, 18, 60) },
        [jointIdMap.rightKnee]: { angle: -25, position: getJointPosition(-25, 20, 110) },
        [jointIdMap.rightAnkle]: { angle: -5, position: getJointPosition(-5, 20, 160) },
      },
      sticks: {
        [stickIdMap.main]: { angle: -90, controlPoint: { x: 0, y: 250 } },
        [stickIdMap.leftHand]: { angle: -70, controlPoint: { x: -100, y: 200 } },
        [stickIdMap.rightHand]: { angle: -110, controlPoint: { x: 100, y: 200 } },
      },
      easing: 'ease-in-out',
    },
    {
      id: generateId(),
      time: 1000,
      joints: {
        [jointIdMap.neck]: { angle: 0, position: getJointPosition(0, 0, -60) },
        [jointIdMap.bodyTop]: { angle: 0, position: getJointPosition(0, 0, 0) },
        [jointIdMap.leftShoulder]: { angle: 70, position: getJointPosition(70, -40, -20) },
        [jointIdMap.leftElbow]: { angle: 50, position: getJointPosition(50, -55, 25) },
        [jointIdMap.leftWrist]: { angle: 0, position: getJointPosition(0, -40, 70) },
        [jointIdMap.rightShoulder]: { angle: -10, position: getJointPosition(-10, 40, -20) },
        [jointIdMap.rightElbow]: { angle: -30, position: getJointPosition(-30, 55, 25) },
        [jointIdMap.rightWrist]: { angle: 0, position: getJointPosition(0, 70, 70) },
        [jointIdMap.leftHip]: { angle: -25, position: getJointPosition(-25, -18, 60) },
        [jointIdMap.leftKnee]: { angle: 0, position: getJointPosition(0, -20, 110) },
        [jointIdMap.leftAnkle]: { angle: 0, position: getJointPosition(0, -20, 160) },
        [jointIdMap.rightHip]: { angle: 25, position: getJointPosition(25, 18, 60) },
        [jointIdMap.rightKnee]: { angle: -15, position: getJointPosition(-15, 20, 110) },
        [jointIdMap.rightAnkle]: { angle: 0, position: getJointPosition(0, 20, 160) },
      },
      sticks: {
        [stickIdMap.main]: { angle: -90, controlPoint: { x: 0, y: 250 } },
        [stickIdMap.leftHand]: { angle: -70, controlPoint: { x: 80, y: 180 } },
        [stickIdMap.rightHand]: { angle: -110, controlPoint: { x: -80, y: 180 } },
      },
      easing: 'ease-in-out',
    },
    {
      id: generateId(),
      time: 1500,
      joints: {
        [jointIdMap.neck]: { angle: 0, position: getJointPosition(0, 0, -60) },
        [jointIdMap.bodyTop]: { angle: 0, position: getJointPosition(0, 0, 0) },
        [jointIdMap.leftShoulder]: { angle: 30, position: getJointPosition(30, -40, -20) },
        [jointIdMap.leftElbow]: { angle: 35, position: getJointPosition(35, -55, 25) },
        [jointIdMap.leftWrist]: { angle: 0, position: getJointPosition(0, -55, 70) },
        [jointIdMap.rightShoulder]: { angle: -30, position: getJointPosition(-30, 40, -20) },
        [jointIdMap.rightElbow]: { angle: -35, position: getJointPosition(-35, 55, 25) },
        [jointIdMap.rightWrist]: { angle: 0, position: getJointPosition(0, 55, 70) },
        [jointIdMap.leftHip]: { angle: 5, position: getJointPosition(5, -18, 60) },
        [jointIdMap.leftKnee]: { angle: -25, position: getJointPosition(-25, -20, 110) },
        [jointIdMap.leftAnkle]: { angle: -5, position: getJointPosition(-5, -20, 160) },
        [jointIdMap.rightHip]: { angle: -5, position: getJointPosition(-5, 18, 60) },
        [jointIdMap.rightKnee]: { angle: 25, position: getJointPosition(25, 20, 110) },
        [jointIdMap.rightAnkle]: { angle: 5, position: getJointPosition(5, 20, 160) },
      },
      sticks: {
        [stickIdMap.main]: { angle: -90, controlPoint: { x: 0, y: 250 } },
        [stickIdMap.leftHand]: { angle: -70, controlPoint: { x: -100, y: 200 } },
        [stickIdMap.rightHand]: { angle: -110, controlPoint: { x: 100, y: 200 } },
      },
      easing: 'ease-in-out',
    },
    {
      id: generateId(),
      time: 2000,
      joints: {
        [jointIdMap.neck]: { angle: 0, position: getJointPosition(0, 0, -60) },
        [jointIdMap.bodyTop]: { angle: 0, position: getJointPosition(0, 0, 0) },
        [jointIdMap.leftShoulder]: { angle: -10, position: getJointPosition(-10, -40, -20) },
        [jointIdMap.leftElbow]: { angle: 30, position: getJointPosition(30, -55, 25) },
        [jointIdMap.leftWrist]: { angle: 0, position: getJointPosition(0, -70, 70) },
        [jointIdMap.rightShoulder]: { angle: 70, position: getJointPosition(70, 40, -20) },
        [jointIdMap.rightElbow]: { angle: -50, position: getJointPosition(-50, 55, 25) },
        [jointIdMap.rightWrist]: { angle: 0, position: getJointPosition(0, 70, 70) },
        [jointIdMap.leftHip]: { angle: 25, position: getJointPosition(25, -18, 60) },
        [jointIdMap.leftKnee]: { angle: 15, position: getJointPosition(15, -20, 110) },
        [jointIdMap.leftAnkle]: { angle: 0, position: getJointPosition(0, -20, 160) },
        [jointIdMap.rightHip]: { angle: -25, position: getJointPosition(-25, 18, 60) },
        [jointIdMap.rightKnee]: { angle: 0, position: getJointPosition(0, 20, 110) },
        [jointIdMap.rightAnkle]: { angle: 0, position: getJointPosition(0, 20, 160) },
      },
      sticks: {
        [stickIdMap.main]: { angle: -90, controlPoint: { x: 0, y: 250 } },
        [stickIdMap.leftHand]: { angle: -70, controlPoint: { x: -80, y: 180 } },
        [stickIdMap.rightHand]: { angle: -110, controlPoint: { x: 80, y: 180 } },
      },
      easing: 'ease-in-out',
    },
  ];

  return {
    id: actionId,
    name: '走路',
    category: '基本身段',
    characterId,
    duration: 2000,
    keyframes,
    description: '标准台步，左右脚交替前行',
    createdAt: Date.now(),
  };
}

export function createBowAction(
  characterId: string,
  jointIdMap: JointIdMap,
  stickIdMap: StickIdMap
): Action {
  const actionId = generateId();
  
  const keyframes: Keyframe[] = [
    {
      id: generateId(),
      time: 0,
      joints: {
        [jointIdMap.neck]: { angle: 0, position: getJointPosition(0, 0, -60) },
        [jointIdMap.bodyTop]: { angle: 0, position: getJointPosition(0, 0, 0) },
        [jointIdMap.leftShoulder]: { angle: 30, position: getJointPosition(30, -40, -20) },
        [jointIdMap.leftElbow]: { angle: 40, position: getJointPosition(40, -55, 25) },
        [jointIdMap.leftWrist]: { angle: 0, position: getJointPosition(0, -55, 70) },
        [jointIdMap.rightShoulder]: { angle: -30, position: getJointPosition(-30, 40, -20) },
        [jointIdMap.rightElbow]: { angle: -40, position: getJointPosition(-40, 55, 25) },
        [jointIdMap.rightWrist]: { angle: 0, position: getJointPosition(0, 55, 70) },
        [jointIdMap.leftHip]: { angle: 5, position: getJointPosition(5, -18, 60) },
        [jointIdMap.leftKnee]: { angle: -5, position: getJointPosition(-5, -20, 110) },
        [jointIdMap.leftAnkle]: { angle: 0, position: getJointPosition(0, -20, 160) },
        [jointIdMap.rightHip]: { angle: -5, position: getJointPosition(-5, 18, 60) },
        [jointIdMap.rightKnee]: { angle: 5, position: getJointPosition(5, 20, 110) },
        [jointIdMap.rightAnkle]: { angle: 0, position: getJointPosition(0, 20, 160) },
      },
      sticks: {
        [stickIdMap.main]: { angle: -90, controlPoint: { x: 0, y: 250 } },
        [stickIdMap.leftHand]: { angle: -70, controlPoint: { x: -120, y: 200 } },
        [stickIdMap.rightHand]: { angle: -110, controlPoint: { x: 120, y: 200 } },
      },
      easing: 'ease-out',
    },
    {
      id: generateId(),
      time: 500,
      joints: {
        [jointIdMap.neck]: { angle: 15, position: getJointPosition(15, 0, -55) },
        [jointIdMap.bodyTop]: { angle: 10, position: getJointPosition(10, 0, 5) },
        [jointIdMap.leftShoulder]: { angle: 50, position: getJointPosition(50, -35, -15) },
        [jointIdMap.leftElbow]: { angle: 80, position: getJointPosition(80, -30, 25) },
        [jointIdMap.leftWrist]: { angle: 15, position: getJointPosition(15, -10, 60) },
        [jointIdMap.rightShoulder]: { angle: -50, position: getJointPosition(-50, 35, -15) },
        [jointIdMap.rightElbow]: { angle: -80, position: getJointPosition(-80, 30, 25) },
        [jointIdMap.rightWrist]: { angle: -15, position: getJointPosition(-15, 10, 60) },
        [jointIdMap.leftHip]: { angle: 5, position: getJointPosition(5, -18, 60) },
        [jointIdMap.leftKnee]: { angle: -5, position: getJointPosition(-5, -20, 110) },
        [jointIdMap.leftAnkle]: { angle: 0, position: getJointPosition(0, -20, 160) },
        [jointIdMap.rightHip]: { angle: -5, position: getJointPosition(-5, 18, 60) },
        [jointIdMap.rightKnee]: { angle: 5, position: getJointPosition(5, 20, 110) },
        [jointIdMap.rightAnkle]: { angle: 0, position: getJointPosition(0, 20, 160) },
      },
      sticks: {
        [stickIdMap.main]: { angle: -80, controlPoint: { x: -20, y: 250 } },
        [stickIdMap.leftHand]: { angle: -85, controlPoint: { x: -30, y: 180 } },
        [stickIdMap.rightHand]: { angle: -95, controlPoint: { x: 30, y: 180 } },
      },
      easing: 'ease-in-out',
    },
    {
      id: generateId(),
      time: 1000,
      joints: {
        [jointIdMap.neck]: { angle: 0, position: getJointPosition(0, 0, -60) },
        [jointIdMap.bodyTop]: { angle: 0, position: getJointPosition(0, 0, 0) },
        [jointIdMap.leftShoulder]: { angle: 30, position: getJointPosition(30, -40, -20) },
        [jointIdMap.leftElbow]: { angle: 40, position: getJointPosition(40, -55, 25) },
        [jointIdMap.leftWrist]: { angle: 0, position: getJointPosition(0, -55, 70) },
        [jointIdMap.rightShoulder]: { angle: -30, position: getJointPosition(-30, 40, -20) },
        [jointIdMap.rightElbow]: { angle: -40, position: getJointPosition(-40, 55, 25) },
        [jointIdMap.rightWrist]: { angle: 0, position: getJointPosition(0, 55, 70) },
        [jointIdMap.leftHip]: { angle: 5, position: getJointPosition(5, -18, 60) },
        [jointIdMap.leftKnee]: { angle: -5, position: getJointPosition(-5, -20, 110) },
        [jointIdMap.leftAnkle]: { angle: 0, position: getJointPosition(0, -20, 160) },
        [jointIdMap.rightHip]: { angle: -5, position: getJointPosition(-5, 18, 60) },
        [jointIdMap.rightKnee]: { angle: 5, position: getJointPosition(5, 20, 110) },
        [jointIdMap.rightAnkle]: { angle: 0, position: getJointPosition(0, 20, 160) },
      },
      sticks: {
        [stickIdMap.main]: { angle: -90, controlPoint: { x: 0, y: 250 } },
        [stickIdMap.leftHand]: { angle: -70, controlPoint: { x: -120, y: 200 } },
        [stickIdMap.rightHand]: { angle: -110, controlPoint: { x: 120, y: 200 } },
      },
      easing: 'ease-in',
    },
  ];

  return {
    id: actionId,
    name: '作揖',
    category: '基本身段',
    characterId,
    duration: 1000,
    keyframes,
    description: '双手抱拳躬身行礼',
    createdAt: Date.now(),
  };
}

export function createGreetingAction(
  characterId: string,
  jointIdMap: JointIdMap,
  stickIdMap: StickIdMap
): Action {
  const actionId = generateId();
  
  const keyframes: Keyframe[] = [
    {
      id: generateId(),
      time: 0,
      joints: {
        [jointIdMap.neck]: { angle: 0, position: getJointPosition(0, 0, -60) },
        [jointIdMap.bodyTop]: { angle: 0, position: getJointPosition(0, 0, 0) },
        [jointIdMap.leftShoulder]: { angle: 30, position: getJointPosition(30, -40, -20) },
        [jointIdMap.leftElbow]: { angle: 40, position: getJointPosition(40, -55, 25) },
        [jointIdMap.leftWrist]: { angle: 0, position: getJointPosition(0, -55, 70) },
        [jointIdMap.rightShoulder]: { angle: -30, position: getJointPosition(-30, 40, -20) },
        [jointIdMap.rightElbow]: { angle: -40, position: getJointPosition(-40, 55, 25) },
        [jointIdMap.rightWrist]: { angle: 0, position: getJointPosition(0, 55, 70) },
        [jointIdMap.leftHip]: { angle: 5, position: getJointPosition(5, -18, 60) },
        [jointIdMap.leftKnee]: { angle: -5, position: getJointPosition(-5, -20, 110) },
        [jointIdMap.leftAnkle]: { angle: 0, position: getJointPosition(0, -20, 160) },
        [jointIdMap.rightHip]: { angle: -5, position: getJointPosition(-5, 18, 60) },
        [jointIdMap.rightKnee]: { angle: 5, position: getJointPosition(5, 20, 110) },
        [jointIdMap.rightAnkle]: { angle: 0, position: getJointPosition(0, 20, 160) },
      },
      sticks: {
        [stickIdMap.main]: { angle: -90, controlPoint: { x: 0, y: 250 } },
        [stickIdMap.leftHand]: { angle: -70, controlPoint: { x: -120, y: 200 } },
        [stickIdMap.rightHand]: { angle: -110, controlPoint: { x: 120, y: 200 } },
      },
      easing: 'ease-out',
    },
    {
      id: generateId(),
      time: 300,
      joints: {
        [jointIdMap.neck]: { angle: 5, position: getJointPosition(5, 0, -58) },
        [jointIdMap.bodyTop]: { angle: 3, position: getJointPosition(3, 0, 2) },
        [jointIdMap.leftShoulder]: { angle: 35, position: getJointPosition(35, -38, -18) },
        [jointIdMap.leftElbow]: { angle: 55, position: getJointPosition(55, -45, 25) },
        [jointIdMap.leftWrist]: { angle: 5, position: getJointPosition(5, -35, 65) },
        [jointIdMap.rightShoulder]: { angle: -35, position: getJointPosition(-35, 38, -18) },
        [jointIdMap.rightElbow]: { angle: -55, position: getJointPosition(-55, 45, 25) },
        [jointIdMap.rightWrist]: { angle: -5, position: getJointPosition(-5, 35, 65) },
        [jointIdMap.leftHip]: { angle: 5, position: getJointPosition(5, -18, 60) },
        [jointIdMap.leftKnee]: { angle: -12, position: getJointPosition(-12, -20, 110) },
        [jointIdMap.leftAnkle]: { angle: 0, position: getJointPosition(0, -20, 160) },
        [jointIdMap.rightHip]: { angle: -5, position: getJointPosition(-5, 18, 60) },
        [jointIdMap.rightKnee]: { angle: 12, position: getJointPosition(12, 20, 110) },
        [jointIdMap.rightAnkle]: { angle: 0, position: getJointPosition(0, 20, 160) },
      },
      sticks: {
        [stickIdMap.main]: { angle: -87, controlPoint: { x: -8, y: 250 } },
        [stickIdMap.leftHand]: { angle: -75, controlPoint: { x: -60, y: 185 } },
        [stickIdMap.rightHand]: { angle: -105, controlPoint: { x: 60, y: 185 } },
      },
      easing: 'ease-in-out',
    },
    {
      id: generateId(),
      time: 600,
      joints: {
        [jointIdMap.neck]: { angle: 10, position: getJointPosition(10, 0, -55) },
        [jointIdMap.bodyTop]: { angle: 5, position: getJointPosition(5, 0, 5) },
        [jointIdMap.leftShoulder]: { angle: 45, position: getJointPosition(45, -35, -15) },
        [jointIdMap.leftElbow]: { angle: 70, position: getJointPosition(70, -35, 25) },
        [jointIdMap.leftWrist]: { angle: 10, position: getJointPosition(10, -20, 55) },
        [jointIdMap.rightShoulder]: { angle: -45, position: getJointPosition(-45, 35, -15) },
        [jointIdMap.rightElbow]: { angle: -70, position: getJointPosition(-70, 35, 25) },
        [jointIdMap.rightWrist]: { angle: -10, position: getJointPosition(-10, 20, 55) },
        [jointIdMap.leftHip]: { angle: 5, position: getJointPosition(5, -18, 60) },
        [jointIdMap.leftKnee]: { angle: -20, position: getJointPosition(-20, -20, 110) },
        [jointIdMap.leftAnkle]: { angle: 0, position: getJointPosition(0, -20, 160) },
        [jointIdMap.rightHip]: { angle: -5, position: getJointPosition(-5, 18, 60) },
        [jointIdMap.rightKnee]: { angle: 20, position: getJointPosition(20, 20, 110) },
        [jointIdMap.rightAnkle]: { angle: 0, position: getJointPosition(0, 20, 160) },
      },
      sticks: {
        [stickIdMap.main]: { angle: -85, controlPoint: { x: -10, y: 250 } },
        [stickIdMap.leftHand]: { angle: -80, controlPoint: { x: -50, y: 170 } },
        [stickIdMap.rightHand]: { angle: -100, controlPoint: { x: 50, y: 170 } },
      },
      easing: 'ease-in-out',
    },
    {
      id: generateId(),
      time: 900,
      joints: {
        [jointIdMap.neck]: { angle: 0, position: getJointPosition(0, 0, -60) },
        [jointIdMap.bodyTop]: { angle: 0, position: getJointPosition(0, 0, 0) },
        [jointIdMap.leftShoulder]: { angle: 30, position: getJointPosition(30, -40, -20) },
        [jointIdMap.leftElbow]: { angle: 40, position: getJointPosition(40, -55, 25) },
        [jointIdMap.leftWrist]: { angle: 0, position: getJointPosition(0, -55, 70) },
        [jointIdMap.rightShoulder]: { angle: -30, position: getJointPosition(-30, 40, -20) },
        [jointIdMap.rightElbow]: { angle: -40, position: getJointPosition(-40, 55, 25) },
        [jointIdMap.rightWrist]: { angle: 0, position: getJointPosition(0, 55, 70) },
        [jointIdMap.leftHip]: { angle: 5, position: getJointPosition(5, -18, 60) },
        [jointIdMap.leftKnee]: { angle: -5, position: getJointPosition(-5, -20, 110) },
        [jointIdMap.leftAnkle]: { angle: 0, position: getJointPosition(0, -20, 160) },
        [jointIdMap.rightHip]: { angle: -5, position: getJointPosition(-5, 18, 60) },
        [jointIdMap.rightKnee]: { angle: 5, position: getJointPosition(5, 20, 110) },
        [jointIdMap.rightAnkle]: { angle: 0, position: getJointPosition(0, 20, 160) },
      },
      sticks: {
        [stickIdMap.main]: { angle: -90, controlPoint: { x: 0, y: 250 } },
        [stickIdMap.leftHand]: { angle: -70, controlPoint: { x: -120, y: 200 } },
        [stickIdMap.rightHand]: { angle: -110, controlPoint: { x: 120, y: 200 } },
      },
      easing: 'ease-in',
    },
  ];

  return {
    id: actionId,
    name: '万福',
    category: '基本身段',
    characterId,
    duration: 900,
    keyframes,
    description: '女子行礼，双手交叠于腰侧',
    createdAt: Date.now(),
  };
}

export function createFistSaluteAction(
  characterId: string,
  jointIdMap: JointIdMap,
  stickIdMap: StickIdMap
): Action {
  const actionId = generateId();
  
  const keyframes: Keyframe[] = [
    {
      id: generateId(),
      time: 0,
      joints: {
        [jointIdMap.neck]: { angle: 0, position: getJointPosition(0, 0, -60) },
        [jointIdMap.bodyTop]: { angle: 0, position: getJointPosition(0, 0, 0) },
        [jointIdMap.leftShoulder]: { angle: 30, position: getJointPosition(30, -40, -20) },
        [jointIdMap.leftElbow]: { angle: 40, position: getJointPosition(40, -55, 25) },
        [jointIdMap.leftWrist]: { angle: 0, position: getJointPosition(0, -55, 70) },
        [jointIdMap.rightShoulder]: { angle: -30, position: getJointPosition(-30, 40, -20) },
        [jointIdMap.rightElbow]: { angle: -40, position: getJointPosition(-40, 55, 25) },
        [jointIdMap.rightWrist]: { angle: 0, position: getJointPosition(0, 55, 70) },
        [jointIdMap.leftHip]: { angle: 5, position: getJointPosition(5, -18, 60) },
        [jointIdMap.leftKnee]: { angle: -5, position: getJointPosition(-5, -20, 110) },
        [jointIdMap.leftAnkle]: { angle: 0, position: getJointPosition(0, -20, 160) },
        [jointIdMap.rightHip]: { angle: -5, position: getJointPosition(-5, 18, 60) },
        [jointIdMap.rightKnee]: { angle: 5, position: getJointPosition(5, 20, 110) },
        [jointIdMap.rightAnkle]: { angle: 0, position: getJointPosition(0, 20, 160) },
      },
      sticks: {
        [stickIdMap.main]: { angle: -90, controlPoint: { x: 0, y: 250 } },
        [stickIdMap.leftHand]: { angle: -70, controlPoint: { x: -120, y: 200 } },
        [stickIdMap.rightHand]: { angle: -110, controlPoint: { x: 120, y: 200 } },
      },
      easing: 'ease-out',
    },
    {
      id: generateId(),
      time: 400,
      joints: {
        [jointIdMap.neck]: { angle: 5, position: getJointPosition(5, 0, -58) },
        [jointIdMap.bodyTop]: { angle: 5, position: getJointPosition(5, 0, 3) },
        [jointIdMap.leftShoulder]: { angle: 55, position: getJointPosition(55, -35, -18) },
        [jointIdMap.leftElbow]: { angle: 75, position: getJointPosition(75, -30, 25) },
        [jointIdMap.leftWrist]: { angle: 10, position: getJointPosition(10, -15, 55) },
        [jointIdMap.rightShoulder]: { angle: -5, position: getJointPosition(-5, 35, -18) },
        [jointIdMap.rightElbow]: { angle: -85, position: getJointPosition(-85, 25, 25) },
        [jointIdMap.rightWrist]: { angle: -10, position: getJointPosition(-10, 5, 55) },
        [jointIdMap.leftHip]: { angle: 5, position: getJointPosition(5, -18, 60) },
        [jointIdMap.leftKnee]: { angle: -5, position: getJointPosition(-5, -20, 110) },
        [jointIdMap.leftAnkle]: { angle: 0, position: getJointPosition(0, -20, 160) },
        [jointIdMap.rightHip]: { angle: -5, position: getJointPosition(-5, 18, 60) },
        [jointIdMap.rightKnee]: { angle: 5, position: getJointPosition(5, 20, 110) },
        [jointIdMap.rightAnkle]: { angle: 0, position: getJointPosition(0, 20, 160) },
      },
      sticks: {
        [stickIdMap.main]: { angle: -85, controlPoint: { x: -10, y: 250 } },
        [stickIdMap.leftHand]: { angle: -75, controlPoint: { x: -20, y: 160 } },
        [stickIdMap.rightHand]: { angle: -105, controlPoint: { x: 20, y: 160 } },
      },
      easing: 'ease-in-out',
    },
    {
      id: generateId(),
      time: 800,
      joints: {
        [jointIdMap.neck]: { angle: 5, position: getJointPosition(5, 0, -58) },
        [jointIdMap.bodyTop]: { angle: 8, position: getJointPosition(8, 0, 5) },
        [jointIdMap.leftShoulder]: { angle: 60, position: getJointPosition(60, -30, -15) },
        [jointIdMap.leftElbow]: { angle: 90, position: getJointPosition(90, -25, 25) },
        [jointIdMap.leftWrist]: { angle: 15, position: getJointPosition(15, -10, 50) },
        [jointIdMap.rightShoulder]: { angle: 0, position: getJointPosition(0, 30, -15) },
        [jointIdMap.rightElbow]: { angle: -95, position: getJointPosition(-95, 15, 25) },
        [jointIdMap.rightWrist]: { angle: -15, position: getJointPosition(-15, 10, 50) },
        [jointIdMap.leftHip]: { angle: 5, position: getJointPosition(5, -18, 60) },
        [jointIdMap.leftKnee]: { angle: -5, position: getJointPosition(-5, -20, 110) },
        [jointIdMap.leftAnkle]: { angle: 0, position: getJointPosition(0, -20, 160) },
        [jointIdMap.rightHip]: { angle: -5, position: getJointPosition(-5, 18, 60) },
        [jointIdMap.rightKnee]: { angle: 5, position: getJointPosition(5, 20, 110) },
        [jointIdMap.rightAnkle]: { angle: 0, position: getJointPosition(0, 20, 160) },
      },
      sticks: {
        [stickIdMap.main]: { angle: -82, controlPoint: { x: -15, y: 250 } },
        [stickIdMap.leftHand]: { angle: -72, controlPoint: { x: -10, y: 150 } },
        [stickIdMap.rightHand]: { angle: -108, controlPoint: { x: 10, y: 150 } },
      },
      easing: 'ease-in-out',
    },
    {
      id: generateId(),
      time: 1200,
      joints: {
        [jointIdMap.neck]: { angle: 0, position: getJointPosition(0, 0, -60) },
        [jointIdMap.bodyTop]: { angle: 0, position: getJointPosition(0, 0, 0) },
        [jointIdMap.leftShoulder]: { angle: 30, position: getJointPosition(30, -40, -20) },
        [jointIdMap.leftElbow]: { angle: 40, position: getJointPosition(40, -55, 25) },
        [jointIdMap.leftWrist]: { angle: 0, position: getJointPosition(0, -55, 70) },
        [jointIdMap.rightShoulder]: { angle: -30, position: getJointPosition(-30, 40, -20) },
        [jointIdMap.rightElbow]: { angle: -40, position: getJointPosition(-40, 55, 25) },
        [jointIdMap.rightWrist]: { angle: 0, position: getJointPosition(0, 55, 70) },
        [jointIdMap.leftHip]: { angle: 5, position: getJointPosition(5, -18, 60) },
        [jointIdMap.leftKnee]: { angle: -5, position: getJointPosition(-5, -20, 110) },
        [jointIdMap.leftAnkle]: { angle: 0, position: getJointPosition(0, -20, 160) },
        [jointIdMap.rightHip]: { angle: -5, position: getJointPosition(-5, 18, 60) },
        [jointIdMap.rightKnee]: { angle: 5, position: getJointPosition(5, 20, 110) },
        [jointIdMap.rightAnkle]: { angle: 0, position: getJointPosition(0, 20, 160) },
      },
      sticks: {
        [stickIdMap.main]: { angle: -90, controlPoint: { x: 0, y: 250 } },
        [stickIdMap.leftHand]: { angle: -70, controlPoint: { x: -120, y: 200 } },
        [stickIdMap.rightHand]: { angle: -110, controlPoint: { x: 120, y: 200 } },
      },
      easing: 'ease-in',
    },
  ];

  return {
    id: actionId,
    name: '抱拳',
    category: '基本身段',
    characterId,
    duration: 1200,
    keyframes,
    description: '左手抱右拳于胸前，拱手为礼',
    createdAt: Date.now(),
  };
}

export function createDefaultDrama(): Drama {
  const { character, jointIdMap, stickIdMap } = createDefaultCharacter();
  const walkAction = createWalkAction(character.id, jointIdMap, stickIdMap);
  const bowAction = createBowAction(character.id, jointIdMap, stickIdMap);
  const greetingAction = createGreetingAction(character.id, jointIdMap, stickIdMap);
  const fistSaluteAction = createFistSaluteAction(character.id, jointIdMap, stickIdMap);

  return {
    id: generateId(),
    name: '西厢记',
    description: '经典剧目《西厢记》选段',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    characters: [character],
    actions: [walkAction, bowAction, greetingAction, fistSaluteAction],
    scenes: [
      {
        id: generateId(),
        name: '第一场 惊艳',
        description: '张生初见莺莺',
        duration: 10000,
        tracks: [
          {
            id: generateId(),
            name: '莺莺',
            characterId: character.id,
            clips: [
              {
                id: generateId(),
                actionId: walkAction.id,
                startTime: 0,
                duration: 2000,
                speed: 1,
                trackId: '',
              },
            ],
            visible: true,
            locked: false,
          },
        ],
      },
    ],
    currentSceneId: '',
  };
}

export function createDemoDramas(): Drama[] {
  const drama1 = createDefaultDrama();
  drama1.name = '西厢记';
  drama1.description = '经典爱情剧目，张生与崔莺莺的故事';
  
  const { character: char2 } = createDefaultCharacter();
  const drama2: Drama = {
    ...createDefaultDrama(),
    id: generateId(),
    name: '牡丹亭',
    description: '汤显祖代表作，杜丽娘还魂记',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
    characters: [
      {
        ...char2,
        id: generateId(),
        name: '杜丽娘',
        role: '闺门旦',
      },
    ],
    actions: [],
    scenes: [],
  };

  const { character: char3a } = createDefaultCharacter();
  const { character: char3b } = createDefaultCharacter();
  const drama3: Drama = {
    ...createDefaultDrama(),
    id: generateId(),
    name: '白蛇传',
    description: '白娘子与许仙的传奇故事',
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 7200000,
    characters: [
      {
        ...char3a,
        id: generateId(),
        name: '白素贞',
        role: '青衣',
      },
      {
        ...char3b,
        id: generateId(),
        name: '小青',
        role: '武旦',
      },
    ],
    actions: [],
    scenes: [],
  };

  return [drama1, drama2, drama3];
}
