import { Drama, Character, Part, Joint, Stick, Action, Keyframe } from '../types';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function createDefaultCharacter(): Character {
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
      childId: leftHipId,
      constraints: { minAngle: -10, maxAngle: 10, locked: false, reverseAllowed: false },
      currentAngle: 0,
    },
    {
      id: leftShoulderId,
      name: '左肩',
      partId: parts[2].id,
      position: { x: 0, y: -5 },
      parentId: bodyTopJointId,
      childId: leftElbowId,
      constraints: { minAngle: -90, maxAngle: 120, locked: false, reverseAllowed: false },
      currentAngle: 30,
    },
    {
      id: leftElbowId,
      name: '左肘',
      partId: parts[3].id,
      position: { x: 0, y: -5 },
      parentId: leftShoulderId,
      childId: leftWristId,
      constraints: { minAngle: 0, maxAngle: 150, locked: false, reverseAllowed: false },
      currentAngle: 40,
    },
    {
      id: leftWristId,
      name: '左腕',
      partId: parts[3].id,
      position: { x: 0, y: 40 },
      parentId: leftElbowId,
      constraints: { minAngle: -45, maxAngle: 45, locked: false, reverseAllowed: false },
      currentAngle: 0,
    },
    {
      id: rightShoulderId,
      name: '右肩',
      partId: parts[4].id,
      position: { x: 0, y: -5 },
      parentId: bodyTopJointId,
      childId: rightElbowId,
      constraints: { minAngle: -120, maxAngle: 90, locked: false, reverseAllowed: false },
      currentAngle: -30,
    },
    {
      id: rightElbowId,
      name: '右肘',
      partId: parts[5].id,
      position: { x: 0, y: -5 },
      parentId: rightShoulderId,
      childId: rightWristId,
      constraints: { minAngle: -150, maxAngle: 0, locked: false, reverseAllowed: false },
      currentAngle: -40,
    },
    {
      id: rightWristId,
      name: '右腕',
      partId: parts[5].id,
      position: { x: 0, y: 40 },
      parentId: rightElbowId,
      constraints: { minAngle: -45, maxAngle: 45, locked: false, reverseAllowed: false },
      currentAngle: 0,
    },
    {
      id: leftHipId,
      name: '左胯',
      partId: parts[6].id,
      position: { x: 0, y: -5 },
      parentId: bodyTopJointId,
      childId: leftKneeId,
      constraints: { minAngle: -45, maxAngle: 90, locked: false, reverseAllowed: false },
      currentAngle: 5,
    },
    {
      id: leftKneeId,
      name: '左膝',
      partId: parts[7].id,
      position: { x: 0, y: -3 },
      parentId: leftHipId,
      childId: leftAnkleId,
      constraints: { minAngle: 0, maxAngle: 130, locked: false, reverseAllowed: false },
      currentAngle: -5,
    },
    {
      id: leftAnkleId,
      name: '左踝',
      partId: parts[7].id,
      position: { x: 0, y: 45 },
      parentId: leftKneeId,
      constraints: { minAngle: -30, maxAngle: 30, locked: false, reverseAllowed: false },
      currentAngle: 0,
    },
    {
      id: rightHipId,
      name: '右胯',
      partId: parts[8].id,
      position: { x: 0, y: -5 },
      parentId: bodyTopJointId,
      childId: rightKneeId,
      constraints: { minAngle: -90, maxAngle: 45, locked: false, reverseAllowed: false },
      currentAngle: -5,
    },
    {
      id: rightKneeId,
      name: '右膝',
      partId: parts[9].id,
      position: { x: 0, y: -3 },
      parentId: rightHipId,
      childId: rightAnkleId,
      constraints: { minAngle: -130, maxAngle: 0, locked: false, reverseAllowed: false },
      currentAngle: 5,
    },
    {
      id: rightAnkleId,
      name: '右踝',
      partId: parts[9].id,
      position: { x: 0, y: 45 },
      parentId: rightKneeId,
      constraints: { minAngle: -30, maxAngle: 30, locked: false, reverseAllowed: false },
      currentAngle: 0,
    },
  ];

  const sticks: Stick[] = [
    {
      id: generateId(),
      name: '主签杆',
      controlPoint: { x: 0, y: 250 },
      targetJointId: bodyTopJointId,
      length: 200,
      angle: -90,
      zIndex: 1,
      color: '#8B4513',
    },
    {
      id: generateId(),
      name: '左手签',
      controlPoint: { x: -120, y: 200 },
      targetJointId: leftWristId,
      length: 180,
      angle: -70,
      zIndex: 2,
      color: '#A0522D',
    },
    {
      id: generateId(),
      name: '右手签',
      controlPoint: { x: 120, y: 200 },
      targetJointId: rightWristId,
      length: 180,
      angle: -110,
      zIndex: 0,
      color: '#8B4513',
    },
  ];

  return {
    id: characterId,
    name: '旦角',
    role: '青衣',
    parts,
    joints,
    sticks,
    description: '标准旦角造型，适合传统剧目',
  };
}

export function createWalkAction(characterId: string): Action {
  const actionId = generateId();
  
  const keyframes: Keyframe[] = [
    {
      id: generateId(),
      time: 0,
      joints: {},
      sticks: {},
      easing: 'ease-in-out',
    },
    {
      id: generateId(),
      time: 500,
      joints: {},
      sticks: {},
      easing: 'ease-in-out',
    },
    {
      id: generateId(),
      time: 1000,
      joints: {},
      sticks: {},
      easing: 'ease-in-out',
    },
    {
      id: generateId(),
      time: 1500,
      joints: {},
      sticks: {},
      easing: 'ease-in-out',
    },
    {
      id: generateId(),
      time: 2000,
      joints: {},
      sticks: {},
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

export function createBowAction(characterId: string): Action {
  const actionId = generateId();
  
  const keyframes: Keyframe[] = [
    {
      id: generateId(),
      time: 0,
      joints: {},
      sticks: {},
      easing: 'ease-out',
    },
    {
      id: generateId(),
      time: 500,
      joints: {},
      sticks: {},
      easing: 'ease-in-out',
    },
    {
      id: generateId(),
      time: 1000,
      joints: {},
      sticks: {},
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

export function createGreetingAction(characterId: string): Action {
  const actionId = generateId();
  
  const keyframes: Keyframe[] = [
    {
      id: generateId(),
      time: 0,
      joints: {},
      sticks: {},
      easing: 'ease-out',
    },
    {
      id: generateId(),
      time: 300,
      joints: {},
      sticks: {},
      easing: 'ease-in-out',
    },
    {
      id: generateId(),
      time: 600,
      joints: {},
      sticks: {},
      easing: 'ease-in-out',
    },
    {
      id: generateId(),
      time: 900,
      joints: {},
      sticks: {},
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

export function createDefaultDrama(): Drama {
  const character = createDefaultCharacter();
  const walkAction = createWalkAction(character.id);
  const bowAction = createBowAction(character.id);
  const greetingAction = createGreetingAction(character.id);

  return {
    id: generateId(),
    name: '西厢记',
    description: '经典剧目《西厢记》选段',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    characters: [character],
    actions: [walkAction, bowAction, greetingAction],
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
  
  const drama2: Drama = {
    ...createDefaultDrama(),
    id: generateId(),
    name: '牡丹亭',
    description: '汤显祖代表作，杜丽娘还魂记',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
    characters: [
      {
        ...createDefaultCharacter(),
        id: generateId(),
        name: '杜丽娘',
        role: '闺门旦',
      },
    ],
    actions: [],
    scenes: [],
  };

  const drama3: Drama = {
    ...createDefaultDrama(),
    id: generateId(),
    name: '白蛇传',
    description: '白娘子与许仙的传奇故事',
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 7200000,
    characters: [
      {
        ...createDefaultCharacter(),
        id: generateId(),
        name: '白素贞',
        role: '青衣',
      },
      {
        ...createDefaultCharacter(),
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
