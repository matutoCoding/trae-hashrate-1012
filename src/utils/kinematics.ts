import { Point, Joint, JointConstraints, Stick } from '../types';

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
  rootJointId: string,
  startPosition: Point
): Map<string, Point> {
  const positions = new Map<string, Point>();
  const jointMap = new Map(joints.map(j => [j.id, j]));
  
  function traverse(jointId: string, currentPos: Point, parentAngle: number) {
    const joint = jointMap.get(jointId);
    if (!joint) return;
    
    const worldAngle = parentAngle + joint.currentAngle;
    positions.set(jointId, currentPos);
    
    if (joint.childId) {
      const childJoint = jointMap.get(joint.childId);
      if (childJoint) {
        const len = distance(joint.position, childJoint.position);
        const endPos = calculateEndPoint(currentPos, len, worldAngle);
        traverse(joint.childId, endPos, worldAngle);
      }
    }
  }
  
  traverse(rootJointId, startPosition, 0);
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

export function checkStickOcclusion(sticks: Stick[]): { stick1: Stick; stick2: Stick; point: Point }[] {
  const intersections: { stick1: Stick; stick2: Stick; point: Point }[] = [];
  
  for (let i = 0; i < sticks.length; i++) {
    for (let j = i + 1; j < sticks.length; j++) {
      const s1 = sticks[i];
      const s2 = sticks[j];
      
      const s1Start = s1.controlPoint;
      const s1End = calculateEndPoint(s1.controlPoint, s1.length, s1.angle);
      const s2Start = s2.controlPoint;
      const s2End = calculateEndPoint(s2.controlPoint, s2.length, s2.angle);
      
      const intersection = lineIntersection(s1Start, s1End, s2Start, s2End);
      if (intersection) {
        intersections.push({ stick1: s1, stick2: s2, point: intersection });
      }
    }
  }
  
  return intersections;
}

function lineIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
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
