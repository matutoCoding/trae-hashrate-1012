import { Point, Joint, JointConstraints, Stick, Keyframe, JointState, StickState, OcclusionInfo, Character, Part } from '../types';

export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

export function normalizeAngle(angle: number): number {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

export function clampAngle(angle: number, constraints: JointConstraints): number {
  if (constraints.locked) {
    return (constraints.minAngle + constraints.maxAngle) / 2;
  }
  const normalizedAngle = normalizeAngle(angle);
  const minNorm = normalizeAngle(constraints.minAngle);
  const maxNorm = normalizeAngle(constraints.maxAngle);
  
  if (minNorm <= maxNorm) {
    return Math.max(minNorm, Math.min(maxNorm, normalizedAngle));
  } else {
    if (normalizedAngle >= minNorm || normalizedAngle <= maxNorm) {
      return normalizedAngle;
    }
    const diffToMin = Math.abs(normalizeAngle(normalizedAngle - minNorm));
    const diffToMax = Math.abs(normalizeAngle(normalizedAngle - maxNorm));
    return diffToMin < diffToMax ? minNorm : maxNorm;
  }
}

export function checkAngleViolation(angle: number, constraints: JointConstraints): boolean {
  if (constraints.locked) return false;
  const normalizedAngle = normalizeAngle(angle);
  const minNorm = normalizeAngle(constraints.minAngle);
  const maxNorm = normalizeAngle(constraints.maxAngle);
  
  if (minNorm <= maxNorm) {
    return normalizedAngle < minNorm || normalizedAngle > maxNorm;
  } else {
    return normalizedAngle > maxNorm && normalizedAngle < minNorm;
  }
}

export function checkReverseBend(joint: Joint, parentAngle: number): boolean {
  if (joint.constraints.reverseAllowed) return false;
  const relativeAngle = normalizeAngle(joint.currentAngle - parentAngle);
  return relativeAngle < 0;
}

export function calculateEndPoint(start: Point, length: number, angleDeg: number): Point {
  const angleRad = degreesToRadians(angleDeg);
  return {
    x: start.x + length * Math.cos(angleRad),
    y: start.y + length * Math.sin(angleRad),
  };
}

export function calculateAngle(from: Point, to: Point): number {
  return radiansToDegrees(Math.atan2(to.y - from.y, to.x - from.x));
}

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

export function forwardKinematics(
  joints: Joint[],
  parts: Part[],
  rootJointId: string,
  startPosition: Point
): Map<string, Point> {
  const positions = new Map<string, Point>();
  const jointMap = new Map(joints.map(j => [j.id, j]));
  const partMap = new Map(parts.map(p => [p.id, p]));
  
  function getJointWorldPosition(joint: Joint): Point {
    const part = partMap.get(joint.partId);
    if (!part) return joint.position;
    
    const rad = degreesToRadians(part.transform.rotation);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    const localX = joint.position.x * part.transform.scale;
    const localY = joint.position.y * part.transform.scale;
    
    const rotatedX = localX * cos - localY * sin;
    const rotatedY = localX * sin + localY * cos;
    
    return {
      x: part.transform.x + rotatedX,
      y: part.transform.y + rotatedY,
    };
  }
  
  function traverse(jointId: string, parentWorldPos: Point, parentWorldAngle: number) {
    const joint = jointMap.get(jointId);
    if (!joint) return;
    
    const jointLocalBase = getJointWorldPosition(joint);
    
    let worldPos: Point;
    let worldAngle: number;
    
    if (!joint.parentId) {
      worldPos = {
        x: startPosition.x + jointLocalBase.x,
        y: startPosition.y + jointLocalBase.y,
      };
      worldAngle = joint.currentAngle;
    } else {
      const parentJoint = jointMap.get(joint.parentId);
      if (parentJoint) {
        const parentLocalBase = getJointWorldPosition(parentJoint);
        const jointLocalBaseForParent = getJointWorldPosition(joint);
        
        const relativeX = jointLocalBaseForParent.x - parentLocalBase.x;
        const relativeY = jointLocalBaseForParent.y - parentLocalBase.y;
        
        const parentRad = degreesToRadians(parentWorldAngle);
        const cos = Math.cos(parentRad);
        const sin = Math.sin(parentRad);
        
        const rotatedX = relativeX * cos - relativeY * sin;
        const rotatedY = relativeX * sin + relativeY * cos;
        
        worldPos = {
          x: parentWorldPos.x + rotatedX,
          y: parentWorldPos.y + rotatedY,
        };
        worldAngle = parentWorldAngle + joint.currentAngle;
      } else {
        worldPos = {
          x: startPosition.x + jointLocalBase.x,
          y: startPosition.y + jointLocalBase.y,
        };
        worldAngle = joint.currentAngle;
      }
    }
    
    positions.set(jointId, worldPos);
    
    if (joint.childId) {
      traverse(joint.childId, worldPos, worldAngle);
    }
  }
  
  const rootJoint = jointMap.get(rootJointId);
  if (rootJoint) {
    traverse(rootJointId, startPosition, 0);
  }
  
  return positions;
}

export function inverseKinematics(
  joints: Joint[],
  endEffectorId: string,
  targetPos: Point,
  basePos: Point
): Map<string, number> {
  const angles = new Map<string, number>();
  const jointMap = new Map(joints.map(j => [j.id, j]));
  
  const chain: Joint[] = [];
  let currentId: string | undefined = endEffectorId;
  while (currentId) {
    const joint = jointMap.get(currentId);
    if (joint) {
      chain.unshift(joint);
      currentId = joint.parentId;
    } else {
      break;
    }
  }
  
  if (chain.length < 2) return angles;
  
  let currentBase = { ...basePos };
  let currentEnd = targetPos;
  
  for (let iteration = 0; iteration < 10; iteration++) {
    for (let i = chain.length - 1; i >= 0; i--) {
      const joint = chain[i];
      const len = i > 0 ? distance(chain[i - 1].position, joint.position) : 0;
      
      if (i > 0) {
        const angle = calculateAngle(currentEnd, currentBase);
        angles.set(joint.id, angle);
        currentBase = calculateEndPoint(currentEnd, len, angle + 180);
      }
    }
    
    currentBase = { ...basePos };
    for (let i = 0; i < chain.length; i++) {
      const joint = chain[i];
      const nextJoint = chain[i + 1];
      const len = nextJoint ? distance(joint.position, nextJoint.position) : 0;
      
      if (nextJoint) {
        const angle = calculateAngle(currentBase, currentEnd);
        angles.set(joint.id, angle);
        currentBase = calculateEndPoint(currentBase, len, angle);
      }
    }
  }
  
  return angles;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpPoint(a: Point, b: Point, t: number): Point {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
  };
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeIn(t: number): number {
  return t * t;
}

export function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export function applyEasing(t: number, easing: string): number {
  switch (easing) {
    case 'ease-in': return easeIn(t);
    case 'ease-out': return easeOut(t);
    case 'ease-in-out': return easeInOut(t);
    default: return t;
  }
}

export function calculateStickEndpoints(
  stick: Stick,
  character: Character
): { p1: Point; p2: Point } {
  const rootJoint = character.joints.find(j => !j.parentId);
  if (!rootJoint) {
    return {
      p1: stick.controlPoint,
      p2: calculateEndPoint(stick.controlPoint, stick.length, stick.angle),
    };
  }

  const jointPositions = forwardKinematics(
    character.joints,
    character.parts,
    rootJoint.id,
    { x: 0, y: 0 }
  );

  const targetJointPos = jointPositions.get(stick.targetJointId);
  
  if (!targetJointPos) {
    return {
      p1: stick.controlPoint,
      p2: calculateEndPoint(stick.controlPoint, stick.length, stick.angle),
    };
  }

  return {
    p1: stick.controlPoint,
    p2: targetJointPos,
  };
}

export function segmentsIntersect(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): Point | null {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(denom) < 0.0001) return null;
  
  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;
  
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: p1.x + ua * (p2.x - p1.x),
      y: p1.y + ua * (p2.y - p1.y),
    };
  }
  
  return null;
}

export function checkStickOcclusion(
  sticks: Stick[],
  character: Character
): OcclusionInfo[] {
  const occlusions: OcclusionInfo[] = [];
  
  for (let i = 0; i < sticks.length; i++) {
    for (let j = i + 1; j < sticks.length; j++) {
      const s1 = sticks[i];
      const s2 = sticks[j];
      
      const endpoints1 = calculateStickEndpoints(s1, character);
      const endpoints2 = calculateStickEndpoints(s2, character);
      
      const intersection = segmentsIntersect(
        endpoints1.p1,
        endpoints1.p2,
        endpoints2.p1,
        endpoints2.p2
      );
      
      if (intersection) {
        const frontStick = s1.zIndex >= s2.zIndex ? s1 : s2;
        const backStick = s1.zIndex < s2.zIndex ? s1 : s2;
        const isCorrect = s1.zIndex !== s2.zIndex;
        
        let suggestion = '';
        if (isCorrect) {
          suggestion = `层级正确：「${frontStick.name}」(zIndex: ${frontStick.zIndex}) 应在「${backStick.name}」(zIndex: ${backStick.zIndex}) 前面`;
        } else {
          suggestion = `层级错误：两根签杆 zIndex 相同，建议将「${frontStick.name}」的 zIndex 调高，或「${backStick.name}」的 zIndex 调低`;
        }
        
        occlusions.push({
          stickId1: s1.id,
          stickId2: s2.id,
          stickName1: s1.name,
          stickName2: s2.name,
          intersectionPoint: intersection,
          frontStickId: frontStick.id,
          isCorrect: isCorrect,
          suggestion: suggestion,
        });
      }
    }
  }
  
  return occlusions;
}

export function autoFixOcclusion(
  sticks: Stick[],
  occlusions: OcclusionInfo[]
): Stick[] {
  const updatedSticks = [...sticks];
  const stickMap = new Map(updatedSticks.map(s => [s.id, s]));
  
  const sortedSticks = [...updatedSticks].sort((a, b) => a.zIndex - b.zIndex);
  
  for (let i = 0; i < sortedSticks.length; i++) {
    const stick = sortedSticks[i];
    const expectedZIndex = i + 1;
    if (stick.zIndex !== expectedZIndex) {
      stickMap.set(stick.id, { ...stick, zIndex: expectedZIndex });
    }
  }
  
  for (const occlusion of occlusions) {
    const s1 = stickMap.get(occlusion.stickId1);
    const s2 = stickMap.get(occlusion.stickId2);
    
    if (s1 && s2 && s1.zIndex === s2.zIndex) {
      const newZIndex = Math.max(s1.zIndex, s2.zIndex) + 1;
      if (occlusion.frontStickId === s1.id) {
        stickMap.set(s1.id, { ...s1, zIndex: newZIndex });
      } else {
        stickMap.set(s2.id, { ...s2, zIndex: newZIndex });
      }
    }
  }
  
  return updatedSticks.map(s => stickMap.get(s.id) || s);
}

export interface InterpolatedState {
  joints: Record<string, JointState>;
  sticks: Record<string, StickState>;
}

export function interpolateKeyframes(keyframes: Keyframe[], time: number): InterpolatedState {
  if (keyframes.length === 0) {
    return { joints: {}, sticks: {} };
  }

  if (keyframes.length === 1) {
    return { joints: keyframes[0].joints, sticks: keyframes[0].sticks };
  }

  const sortedFrames = [...keyframes].sort((a, b) => a.time - b.time);

  if (time <= sortedFrames[0].time) {
    return { joints: sortedFrames[0].joints, sticks: sortedFrames[0].sticks };
  }

  if (time >= sortedFrames[sortedFrames.length - 1].time) {
    return { joints: sortedFrames[sortedFrames.length - 1].joints, sticks: sortedFrames[sortedFrames.length - 1].sticks };
  }

  let prevFrame = sortedFrames[0];
  let nextFrame = sortedFrames[sortedFrames.length - 1];

  for (let i = 0; i < sortedFrames.length - 1; i++) {
    if (time >= sortedFrames[i].time && time <= sortedFrames[i + 1].time) {
      prevFrame = sortedFrames[i];
      nextFrame = sortedFrames[i + 1];
      break;
    }
  }

  const frameDuration = nextFrame.time - prevFrame.time;
  let t = frameDuration > 0 ? (time - prevFrame.time) / frameDuration : 0;

  const easing = nextFrame.easing || prevFrame.easing || 'linear';
  t = applyEasing(t, easing);

  const joints: Record<string, JointState> = {};
  const allJointIds = new Set([...Object.keys(prevFrame.joints), ...Object.keys(nextFrame.joints)]);

  allJointIds.forEach(jointId => {
    const prevState = prevFrame.joints[jointId];
    const nextState = nextFrame.joints[jointId];

    if (prevState && nextState) {
      joints[jointId] = {
        angle: lerp(prevState.angle, nextState.angle, t),
        position: lerpPoint(prevState.position, nextState.position, t),
      };
    } else if (prevState) {
      joints[jointId] = { ...prevState };
    } else if (nextState) {
      joints[jointId] = { ...nextState };
    }
  });

  const sticks: Record<string, StickState> = {};
  const allStickIds = new Set([...Object.keys(prevFrame.sticks), ...Object.keys(nextFrame.sticks)]);

  allStickIds.forEach(stickId => {
    const prevState = prevFrame.sticks[stickId];
    const nextState = nextFrame.sticks[stickId];

    if (prevState && nextState) {
      sticks[stickId] = {
        angle: lerp(prevState.angle, nextState.angle, t),
        controlPoint: lerpPoint(prevState.controlPoint, nextState.controlPoint, t),
      };
    } else if (prevState) {
      sticks[stickId] = { ...prevState };
    } else if (nextState) {
      sticks[stickId] = { ...nextState };
    }
  });

  return { joints, sticks };
}
